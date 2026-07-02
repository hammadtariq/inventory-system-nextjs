# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev          # Start dev server (uses --max-old-space-size=8192)
pnpm build        # Build for production
pnpm start        # Start production server

# Testing
pnpm test                    # Run all Jest tests
pnpm test -- --testPathPattern="purchase"  # Run a single test file by pattern

# Code quality
pnpm lint         # ESLint via next lint
pnpm prettier     # Format all files
pnpm prettier:check  # Check formatting without writing

# Database (sequelize-cli must be installed globally)
sequelize db:migrate          # Run pending migrations
sequelize db:migrate:undo:all # Rollback all migrations
sequelize db:seed:all         # Seed database
sequelize migration:generate --name <migration-name>  # Create new migration
```

### Environment setup

Create a `.env` file with:

```
POSTGRES_DB=databasename
POSTGRES_USER=username
POSTGRES_PASSWORD=password
TOKEN_SECRET=minimum-32-characters-long-token-secret
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

Start the database: `docker-compose up -d`

## Architecture

This is a **full-stack Next.js app** (Pages Router) with a PostgreSQL database via Sequelize. Frontend and backend coexist in the same repository.

### Request lifecycle

1. **Frontend** (`hooks/`) — SWR-based data fetching hooks call `lib/http-client.js` (axios wrapper)
2. **API routes** (`pages/api/`) — next-connect handlers with `auth` middleware, Joi validation, then Sequelize queries
3. **Middleware** (`middlewares/auth.js`) — decrypts `@hapi/iron`-sealed JWT from httpOnly cookie, validates against DB
4. **Database** (`lib/postgres.js`) — single Sequelize instance with all models and associations registered; call `db.dbConnect()` at the start of every API handler

### Key directories

- `pages/api/` — API routes organized by domain (purchase, sales, inventory, ledger, etc.). Each file exports a `nextConnect()` chain.
- `pages/` — UI pages; non-login pages are wrapped in `ProtectedRoutes`
- `components/` — Ant Design-based React components (no subdirectory nesting)
- `hooks/` — SWR hooks and mutation functions per domain (e.g., `hooks/purchase.js`)
- `models/` — Sequelize model definitions (CJS `module.exports`); each exports a factory `(sequelize, DataTypes) => Model`
- `migrations/` — Sequelize migrations
- `lib/` — Shared server+client utilities: `postgres.js` (db), `auth-cookies.js` (cookie helpers), `http-client.js` (axios), `bcrypt.js`, `export-utils.js`
- `utils/` — Pure utility functions split by concern: `api.util.js` (STATUS/SPEND_TYPE enums, server-side), `ui.util.js` (date formats, UI constants, client-side), `permission.util.js` (singleton), `storage.util.js`, `to.util.js`
- `data/permission.js` — ADMIN vs EDITOR permission maps used by `PermissionsUtil`
- `config/config.js` — Sequelize DB config per environment (development/test/production)
- `__tests__/` — Jest tests under `api/` (per-handler unit tests with `node-mocks-http`) and `utils/`

### Auth & permissions

- Auth uses httpOnly cookies containing an `@hapi/iron`-sealed token; verified by `middlewares/auth.js` on every protected API route
- Frontend route protection: `components/protectedRoutes.js` calls `verifyToken()` on every route change and redirects to `/login` on failure
- RBAC: two roles (`ADMIN`, `EDITOR`) defined in `data/permission.js`. `PermissionsUtil` (singleton) is initialized in `_app.js` from `localStorage` user data and used throughout the UI

### Domain models & relationships

Core models: **User**, **Customer**, **Company**, **Inventory**, **Purchase**, **PurchaseHistory**, **Sale**, **Items**, **Ledger**, **Cheque**

Key associations:

- `Purchase` belongs to `Company`; stores `purchasedProducts` as JSONB
- `Sale` belongs to `Customer`
- `Ledger` belongs to both `Customer` and `Company`
- `PurchaseHistory` tracks revisions of a Purchase

### Status enums

Purchase/Sale status: `PENDING → APPROVED | CANCEL` (defined in `utils/api.util.js`)

### Testing patterns

Tests use `node-mocks-http` for request/response mocking. DB is mocked via `jest.mock("@/lib/postgres", ...)`. SQLite in-memory (`sqlite3`) is used in `__tests__/api/test-setup.js` for tests that need real model behavior. Tests live in `__tests__/api/<domain>/` and `__tests__/utils/`.

### Path alias

`@/` maps to the project root (configured in `jsconfig.json` and `jest.config.js`).

---

## Tenant Safety Rules (ENFORCE ON EVERY API CHANGE)

Multi-tenancy is live, not aspirational. Every domain table has a non-nullable `organizationId`, and tenant scoping is enforced at three layers: application hooks, Postgres RLS, and (currently, defense-in-depth only) the connecting DB role. Read this section before touching any API route, model, or raw-SQL script — it reflects what's actually wired up, not a target state.

### Layer 1: `TenantContext` + automatic write hooks

- `lib/tenant-context.js` exports `TenantContext`, an `AsyncLocalStorage`-backed singleton. `middlewares/auth.js` calls `TenantContext.run(organization.id, () => next())` on every authenticated request, so `TenantContext.get()` / `TenantContext.assertGet()` return the current `organizationId` anywhere downstream — no need to thread it through function params.
- `lib/tenant-write-hooks.js` exports `applyTenantWriteHooks(Model)`, applied in `lib/postgres.js` to every model in `TENANT_MODELS` (`User`, `Customer`, `Company`, `Inventory`, `Purchase`, `PurchaseHistory`, `Sale`, `SaleReturn`, `Items`, `Ledger`, `Cheque`). These hooks:
  - auto-inject `organizationId` on `create`/`bulkCreate` from `TenantContext.assertGet()` — **you usually don't need to set `organizationId` by hand on a `Model.create()` call**
  - auto-scope the `where` clause on `find`/`count`/`bulkUpdate`/`bulkDestroy` to the current tenant
  - throw `"Cross-tenant create/update/destroy attempted"` if an instance's `organizationId` doesn't match the current tenant
  - can be skipped with `{ tenantBypass: true }` — reserved for genuinely cross-tenant operations gated by `SUPER_ADMIN` role checks (org registration/management, invite-accept, login's Organization lookup). Grep any new `tenantBypass: true` usage hard in review.

### Layer 2: Postgres Row-Level Security

- `migrations/20260430120000-enable-row-level-security.js` enables `FORCE ROW LEVEL SECURITY` with a `USING/WITH CHECK ("organizationId" = current_setting('app.tenant_id', true)::int)` policy on `customers`, `companies`, `inventories`, `purchases`, `sales`, `saleReturns`, `items`, `ledgers`, `cheques`, `purchase_histories`. `users`/`organizations` are intentionally excluded (they're the tenant boundary itself, not tenant-scoped data).
- `middlewares/auth.js` and `lib/tenant-transaction.js` (`createTenantTransaction`/`applyTenantToTransaction`) both run `SET LOCAL app.tenant_id = :organizationId` inside the request's transaction, so RLS enforces the same boundary the app hooks do — belt and suspenders.
- **Known gap:** `20260430121000-demote-app-role-for-rls.js` — meant to strip `SUPERUSER`/`BYPASSRLS` from the connecting DB role so RLS is an actual hard boundary — is marked done-but-skipped on Supabase ("role alteration not permitted"). Postgres never applies RLS to a superuser or `BYPASSRLS` role regardless of `FORCE`, so **on production, RLS is currently defense-in-depth only; the app-layer hooks in Layer 1 are the real boundary.** `scripts/verify-security.js`'s `verifyRole()` step will throw if run against a role that still bypasses RLS — treat a failure there as "expected on Supabase until the role is actually demoted," not a regression. Locally, `docker-compose`'s `postgres` role is correctly demoted (`rolsuper=false`, `rolbypassrls=false`), so RLS is fully enforced in dev/CI.

### Layer 3: verification scripts

- `pnpm run db:verify-tenants` (`scripts/verify-tenant-backfill.js`) — every tenant table has `organizationId` populated
- `pnpm run db:verify-rls` (`scripts/verify-rls.js`) — inserts as one org, confirms a second org and an anonymous session can't see those rows
- `pnpm run db:verify-security` (`scripts/verify-security.js`) — runs role, column, index, RLS-catalog, backfill, and RLS checks together; this is the one CI/pre-launch should gate on

### Hard rules (still apply on top of the automatic hooks)

- **NEVER** use `findByPk(id)` alone on a `TENANT_MODELS` model — use `findOne({ where: { id, organizationId } })`, or pass `{ tenantBypass: true }` only when the model isn't tenant-scoped (see below) and the route is role-gated
- **NEVER** use `Model.update()`/`Model.destroy()` with a bare `{ where: { id } }` — the hooks will auto-scope it, but don't rely on that being the only line of defense in new code; write the `organizationId` explicitly for readability
- **NEVER** use raw `sequelize.query(sql)` without `organizationId` in the `replacements` object — raw queries bypass both the hooks and (if run outside a `SET LOCAL app.tenant_id` transaction) RLS
- **NEVER** trust incoming `companyId`, `customerId`, `saleId`, or JSONB product IDs without verifying they belong to the current tenant first (see `pages/api/purchase/index.js`'s `db.Items.findAll({ where: { id: productIds, companyId, organizationId } })` for the pattern)
- **ALWAYS** call `TenantContext.assertGet()` (not `TenantContext.get()`, which returns `null` silently) when a handler requires tenant context
- **ALWAYS** return 404 (not 403) when a record is not found for the tenant — avoid leaking existence of records
- Every new Sequelize model that holds tenant data **MUST** have `organizationId` as a non-nullable FK, be added to `TENANT_MODELS` in `lib/tenant-write-hooks.js`, and get an RLS policy in a new migration

### Current `findByPk` usage (audited 2026-07-02 — re-run `.claude/scripts/tenant-check.sh` before trusting this list)

Only 6 `findByPk` calls exist repo-wide, all legitimate:

- `lib/organization-scope.js`, `pages/api/org/accept-invite.js`, `pages/api/organizations/[id].js` (×2), `pages/api/user/login.js` — all look up `db.Organization`, which isn't in `TENANT_MODELS` (it's the tenant boundary, not tenant data) and is either pre-auth (login, invite-accept) or `SUPER_ADMIN`-gated (`pages/api/organizations/[id].js`)
- `pages/api/admin/public-payment-requests/[id].js` — looks up `db.PublicPaymentRequest`, a genuinely global pre-signup model with no `organizationId` column, gated by a `SUPER_ADMIN` role check instead of tenant scoping

The old claim of "30 `findByPk` calls across 14 files" predates the `TenantContext`/RLS work above and is stale — don't cite it.

---

## Adding a New Domain Feature (Agent Scaffolding Pattern)

When adding a new domain (e.g., "returns", "vendor", "barcode"), create these files in order:

1. **Model** — `models/<domain>.js` — must include `organizationId` FK
2. **Migration** — `sequelize migration:generate --name add-<domain>` — use expand/backfill/contract for production safety
3. **API routes** — `pages/api/<domain>/index.js` (list/create), `pages/api/<domain>/[id].js` (get/update/delete)
4. **SWR hook** — `hooks/<domain>.js` — mirrors the pattern in `hooks/purchase.js`
5. **Component** — `components/<Domain>Form.js`, `components/<Domain>Table.js`
6. **Tests** — `__tests__/api/<domain>/<handler>.test.js` — must include a cross-tenant access test

Every API route must follow this exact structure:

```js
import nc from "next-connect";
import { auth } from "@/middlewares/auth";
import db from "@/lib/postgres";

const handler = nc({ onError, onNoMatch });
handler.use(auth);

handler.get(async (req, res) => {
  await db.dbConnect();
  const { organizationId } = getTenantContext(req);
  // all queries scoped to organizationId
});

export default handler;
```

---

## Deployment

### Infrastructure

- **Hosting:** Vercel (Hobby free tier) — target subdomain: `inventory.treesols.com`
- **Database:** Supabase free tier — project `rbkipyssjjpenpohpiyl`
  - Direct host: `db.rbkipyssjjpenpohpiyl.supabase.co` (port 5432) — for migrations and psql
  - Pooler host: `aws-0-<region>.pooler.supabase.co` (port 6543, Transaction mode) — use this on Vercel if connection limits are hit

### Status (as of 2026-06-25)

- [x] All Sequelize migrations run successfully on Supabase
- [x] Production data imported from `inventory_backup_20_06_26` (all 12 tables)
- [x] `config/config.js` updated — reads all DB config from env vars; production forces SSL
- [x] `.env` updated with `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_SSL` vars
- [ ] Vercel project created and connected to GitHub repo
- [ ] Custom domain `inventory.treesols.com` configured (CNAME → `cname.vercel-dns.com`)

### Vercel environment variables (set in Vercel dashboard)

```
POSTGRES_HOST=db.rbkipyssjjpenpohpiyl.supabase.co
POSTGRES_PORT=5432
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<see .env Supabase section>
TOKEN_SECRET=<same value as local .env>
NODE_ENV=production
```

### Migration notes

- `purchase_histories` had no migration file — `20260428094000-create-purchase-history.js` was created
- `purchases` was missing `revisionNo`/`revisionDetails` columns (existed in model, not in migration) — `20260625120000-add-revision-fields-to-purchases.js` was created
- `20260430121000-demote-app-role-for-rls.js` is skipped on Supabase (role alteration not permitted; marked done in SequelizeMeta)

### Running migrations against Supabase

```bash
POSTGRES_USER=postgres \
POSTGRES_PASSWORD=<password> \
POSTGRES_DB=postgres \
POSTGRES_HOST=db.rbkipyssjjpenpohpiyl.supabase.co \
POSTGRES_PORT=5432 \
NODE_ENV=development \
npx sequelize-cli db:migrate
```

---

## Agentic Workflow Notes

- **Bug reported?** Paste the GitHub issue URL — agent reads via GitHub MCP, traces the request lifecycle, fixes, opens PR
- **New feature?** Describe it; agent reads similar existing domain files first, then scaffolds using the pattern above
- **Schema question?** Agent uses PostgreSQL MCP to inspect live schema — no need to describe it manually
- **Tenant audit?** Run `.claude/scripts/tenant-check.sh` to find all unscoped queries
- **Before every PR:** Agent checks for tenant safety violations automatically via CI

---

## Agent skills

### Issue tracker

Issues live in GitHub Issues at `hammadtariq/inventory-system-nextjs`; external PRs are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary — `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` + `docs/adr/` at the repo root (neither exists yet; skills proceed silently). See `docs/agents/domain.md`.
