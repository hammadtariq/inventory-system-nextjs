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
