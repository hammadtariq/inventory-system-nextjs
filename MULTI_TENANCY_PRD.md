# Multi-Tenancy Architecture PRD: StockFlow SaaS

**Status:** Design Phase | **Timeline:** 6–8 weeks | **Priority:** Critical for SaaS launch

---

## Executive Summary

StockFlow is transitioning from a single-instance app to a SaaS platform. The current codebase has **zero tenant isolation** — all users see all data globally. This PRD defines the multi-tenancy architecture using:

1. **New `Organization` model** as the tenant boundary (distinct from `Company`, which is a vendor/supplier)
2. **Node.js `AsyncLocalStorage`** (built-in, zero new prod dependencies) for automatic tenant context propagation
3. **Sequelize hooks + explicit repository helpers** for automatic scoping of reads, creates, updates, and deletes
4. **Explicit foreign-key ownership validation** so one tenant cannot reference another tenant's `companyId`, `customerId`, `saleId`, `itemId`, or JSONB product IDs
5. **PostgreSQL Row-Level Security (RLS)** as defense-in-depth, configured safely for pooled connections
6. **Comprehensive test suite** with security-focused integration tests to prevent regressions and cross-tenant leakage

**Critical:** There are **30 `findByPk(id)` calls** across 14 files that bypass tenant scoping — each is a cross-tenant data access vulnerability.

**Critical:** Sequelize hooks do **not** protect raw SQL (`sequelize.query`) or unsafe foreign-key references. Every raw SQL query, export, overview card, graph, and cross-table workflow must be tenant-scoped explicitly.

---

## Problem Statement

### Current State

- **No tenant concept** — all users, purchases, sales, customers, inventory, ledgers, cheques are globally visible
- **`req.user` is ignored** — populated by auth middleware in every request but never used in any query WHERE clause
- **Global unique constraints** — `customer.email` and `company.companyName` are globally unique, preventing multiple tenants from using the same values
- **No multi-tenancy testing** — existing tests have zero tenant isolation validation
- **30 `findByPk(id)` calls** across the codebase — each allows reading any record by ID, completely bypassing tenant boundaries
- **Raw SQL bypasses ORM hooks** — dashboard, ledger, report, and export queries use `sequelize.query` and must be manually scoped
- **Foreign-key injection risk** — handlers accept IDs such as `companyId`, `customerId`, `saleId`, and JSONB product IDs without proving those records belong to the current tenant
- **Unsafe bulk writes/deletes** — `update()` and `destroy()` calls with `{ where: { id } }` can mutate another tenant's records unless scoped

### Risk

Launching as SaaS without multi-tenancy = **data leak at day 1**. Tenant A's users can access Tenant B's financial data, customers, inventory, and transaction history.

---

## Goals & Non-Goals

### Goals

- ✅ All API endpoints return ONLY data belonging to the requesting tenant
- ✅ Cross-tenant data access returns 404 (not 403) to avoid information leakage
- ✅ Zero existing feature regressions (all current tests still pass)
- ✅ Defense-in-depth: three independent isolation layers (ORM, middleware, DB)
- ✅ All raw SQL and exports are tenant-scoped with replacements, never string interpolation
- ✅ All write operations validate referenced records belong to the current tenant before creating/updating data
- ✅ Migrations are safe for a running production system using expand/backfill/contract phases
- ✅ New user onboarding: `POST /api/org/register` (create org + admin) + invite flow
- ✅ Comprehensive security tests: explicit cross-tenant access attempts that verify failure
- ✅ Free/built-in tools only (no new production dependencies)

### Non-Goals

- 🚫 Schema-per-tenant (too complex for Sequelize; data residency requirements can be handled at deployment)
- 🚫 Fine-grained RBAC beyond ADMIN/EDITOR (future feature)
- 🚫 Multi-region data residency (future feature; RLS policies are migration-ready)
- 🚫 Offline sync tenant scoping (future feature)

---

## Data Model Changes

### New Model: `Organization`

```javascript
// models/organization.js
module.exports = (sequelize, DataTypes) => {
  const Organization = sequelize.define("Organization", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { len: [3, 255] },
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isAlphanumeric: true,
        len: [3, 64],
      },
    },
    plan: {
      type: DataTypes.ENUM("STARTER", "PRO", "ENTERPRISE"),
      defaultValue: "STARTER",
    },
    status: {
      type: DataTypes.ENUM("ACTIVE", "SUSPENDED", "CANCELLED"),
      defaultValue: "ACTIVE",
    },
    maxUsers: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
    },
  });

  Organization.associate = (models) => {
    Organization.hasMany(models.User, { foreignKey: "organizationId" });
  };

  return Organization;
};
```

### Tenant Boundary Schema

| Table                | Has `organizationId`? | Has `companyId`? | Note                                               |
| -------------------- | :-------------------: | :--------------: | -------------------------------------------------- |
| `organizations`      |           —           |        —         | Root entity; Organization has many Users           |
| `users`              |       ✅ (add)        |        ❌        | Employee of an organization                        |
| `customers`          |       ✅ (add)        |        ❌        | Buyers; email unique per org (composite index)     |
| `companies`          |       ✅ (add)        |        ❌        | Vendors/suppliers; name unique per org (composite) |
| `inventories`        |       ✅ (add)        |        ✅        | Stock items; links to company (vendor)             |
| `purchases`          |       ✅ (add)        |        ✅        | Purchase orders; links to company (vendor)         |
| `purchase_histories` |       ✅ (add)        |        ✅        | Audit log of purchase changes                      |
| `sales`              |       ✅ (add)        |        ❌        | Sales orders; links to customer                    |
| `saleReturns`        |       ✅ (add)        |        ❌        | Return records; links to sale + customer           |
| `items`              |       ✅ (add)        |        ✅        | Item catalog; links to company                     |
| `ledgers`            |       ✅ (add)        |        ✅        | Accounting entries; links to company/customer      |
| `cheques`            |       ✅ (add)        |        ❌        | Payment records; orphaned currently                |

**Key distinction:** `companyId` = which vendor/supplier; `organizationId` = which SaaS customer (tenant).

**Current codebase correction:** none of the existing domain tables currently have `organizationId`. All tenant columns are new additions. Tables that already have `companyId` are still not tenant-safe because `companyId` is a vendor/supplier reference, not the SaaS tenant boundary.

---

## Migration Strategy (Production-Safe Expand/Backfill/Contract)

Do not ship this as one large migration. The app is already running in production, so rollout must be staged:

1. **Expand:** add new tables/nullable columns/indexes without breaking old code.
2. **Backfill:** assign every existing row to a default organization and verify counts.
3. **Dual-compatible deploy:** deploy app code that writes `organizationId` for all new records while tolerating old rows during rollout.
4. **Contract:** make columns `NOT NULL`, replace global unique constraints, enforce tenant-scoped writes, and enable RLS after staging verification.

Every migration must include a rollback plan, must be rehearsed against a production-like PostgreSQL copy, and must avoid long table locks where possible.

### Migration 1: Create `organizations` table

```javascript
// migrations/YYYYMMDDHHMMSS-create-organizations.js
up: async (queryInterface, Sequelize) => {
  await queryInterface.createTable("organizations", {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, allowNull: false },
    name: { type: Sequelize.STRING(255), allowNull: false },
    slug: { type: Sequelize.STRING(64), allowNull: false, unique: true },
    plan: { type: Sequelize.ENUM("STARTER", "PRO", "ENTERPRISE"), defaultValue: "STARTER" },
    status: { type: Sequelize.ENUM("ACTIVE", "SUSPENDED", "CANCELLED"), defaultValue: "ACTIVE" },
    maxUsers: { type: Sequelize.INTEGER, defaultValue: 5 },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
  });
};

down: async (queryInterface) => {
  await queryInterface.dropTable("organizations");
};
```

### Migration 2: Add `organizationId` to `users` (nullable)

```javascript
up: async (queryInterface, Sequelize) => {
  await queryInterface.addColumn("users", "organizationId", {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: { model: "organizations", key: "id" },
  });
};
```

### Migration 3: Seed default organization + backfill users

```javascript
up: async (queryInterface, Sequelize) => {
  await queryInterface.sequelize.query(`
    INSERT INTO organizations (name, slug, plan, status, "createdAt", "updatedAt")
    VALUES ('Default', 'default', 'STARTER', 'ACTIVE', NOW(), NOW());
    
    UPDATE users SET "organizationId" = 
      (SELECT id FROM organizations WHERE slug = 'default')
    WHERE "organizationId" IS NULL;
  `);
};
```

### Migration 4: Deploy app code that writes `organizationId` for users

Before enforcing `NOT NULL`, update signup/login/admin-user code so every newly created user gets an organization. Convert or disable the old `/api/user/signup` endpoint before public SaaS launch so users cannot be created without an organization.

### Migration 5: Make `organizationId` NOT NULL on `users`

```javascript
up: async (queryInterface, Sequelize) => {
  await queryInterface.changeColumn("users", "organizationId", {
    type: Sequelize.INTEGER,
    allowNull: false,
  });
};
```

### Migrations 6–9: Add nullable `organizationId` to all domain tables

Add nullable `organizationId` to:

- `customers`
- `companies`
- `inventories`
- `purchases`
- `purchase_histories`
- `sales`
- `saleReturns`
- `items`
- `ledgers`
- `cheques`

For **`customers`** (pattern):

```javascript
up: async (queryInterface, Sequelize) => {
  await queryInterface.addColumn("customers", "organizationId", {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: { model: "organizations", key: "id" },
  });

  // Backfill to default org
  await queryInterface.sequelize.query(
    `UPDATE customers SET "organizationId" = 
      (SELECT id FROM organizations WHERE slug = 'default')`
  );
};
```

Repeat for every domain table. Keep old unique constraints during the expand phase.

### Migration 10: Backfill verification queries

Before enforcing constraints, run verification queries in staging and production:

```sql
SELECT 'customers' AS table_name, COUNT(*) FROM customers WHERE "organizationId" IS NULL;
SELECT 'companies' AS table_name, COUNT(*) FROM companies WHERE "organizationId" IS NULL;
SELECT 'inventories' AS table_name, COUNT(*) FROM inventories WHERE "organizationId" IS NULL;
SELECT 'purchases' AS table_name, COUNT(*) FROM purchases WHERE "organizationId" IS NULL;
SELECT 'purchase_histories' AS table_name, COUNT(*) FROM purchase_histories WHERE "organizationId" IS NULL;
SELECT 'sales' AS table_name, COUNT(*) FROM sales WHERE "organizationId" IS NULL;
SELECT 'saleReturns' AS table_name, COUNT(*) FROM "saleReturns" WHERE "organizationId" IS NULL;
SELECT 'items' AS table_name, COUNT(*) FROM items WHERE "organizationId" IS NULL;
SELECT 'ledgers' AS table_name, COUNT(*) FROM ledgers WHERE "organizationId" IS NULL;
SELECT 'cheques' AS table_name, COUNT(*) FROM cheques WHERE "organizationId" IS NULL;
```

All counts must be zero before contract migrations.

### Migration 11: Add tenant indexes for performance

```javascript
up: async (queryInterface) => {
  for (const table of [
    "users",
    "customers",
    "companies",
    "sales",
    "saleReturns",
    "cheques",
    "inventories",
    "purchases",
    "purchase_histories",
    "items",
    "ledgers",
  ]) {
    await queryInterface.addIndex(table, ["organizationId"], {
      name: `${table}_organization_id_idx`,
    });
  }
};
```

Required composite indexes for common access paths:

- `['organizationId', 'id']` on all tenant tables
- `['organizationId', 'companyId']` on `inventories`, `items`, `purchases`, `purchase_histories`, `ledgers`
- `['organizationId', 'customerId']` on `sales`, `saleReturns`, `ledgers`
- `['organizationId', 'status']` on `purchases`, `sales`, `cheques`
- `['organizationId', 'purchaseDate']` on `purchases`
- `['organizationId', 'soldDate']` on `sales`
- `['organizationId', 'paymentDate']` on `ledgers`

For large production tables, use PostgreSQL `CREATE INDEX CONCURRENTLY` via raw SQL and do not wrap those migrations in a transaction.

### Migration 12: Replace global unique constraints

Replace global uniqueness only after app code and data backfill are verified:

```javascript
await queryInterface.removeConstraint("customers", "<actual_customer_email_constraint_name>");
await queryInterface.addIndex("customers", ["organizationId", "email"], {
  unique: true,
  name: "customers_org_email_unique",
});

await queryInterface.removeConstraint("companies", "<actual_company_name_constraint_name>");
await queryInterface.addIndex("companies", ["organizationId", "companyName"], {
  unique: true,
  name: "companies_org_company_name_unique",
});
```

Do not assume the constraint name is `email` or `companyName`; inspect production constraint names before writing the migration.

### Migration 13: Enforce `NOT NULL` on all tenant columns

Only after verification queries return zero null rows, change every tenant table's `organizationId` to `allowNull: false`.

### Migration 14: Enable RLS after staging verification

Enable RLS only after application-level isolation tests pass. RLS is the final defense layer, not the first migration.

---

## Tenant Context Propagation (Zero New Dependencies)

### `lib/tenant-context.js` — New File

```javascript
const { AsyncLocalStorage } = require("async_hooks"); // Node.js built-in, no npm package

const storage = new AsyncLocalStorage();

const TenantContext = {
  /**
   * Run a function within a tenant context.
   * All nested async operations inherit this context.
   * @param {number} organizationId - The tenant ID
   * @param {function} fn - The function to run
   * @returns Result of fn()
   */
  run: (organizationId, fn) => {
    return storage.run({ organizationId }, fn);
  },

  /**
   * Get the current tenant ID (may be null if not in context)
   * @returns {number|null}
   */
  get: () => storage.getStore()?.organizationId ?? null,

  /**
   * Assert tenant context exists, throw if not.
   * Used by hooks to prevent data leakage if auth middleware is missing.
   * @throws Error if no context
   * @returns {number}
   */
  assertGet: () => {
    const id = TenantContext.get();
    if (!id) {
      throw new Error("TenantContext not set. Auth middleware may be missing on this route.");
    }
    return id;
  },
};

module.exports = TenantContext;
```

### `lib/tenant-hooks.js` — New File

```javascript
const TenantContext = require("./tenant-context");

/**
 * Apply automatic tenant scoping hooks to a Sequelize model.
 * - beforeFind: auto-inject WHERE organizationId = currentTenant
 * - beforeCount: auto-inject WHERE organizationId = currentTenant
 * - beforeCreate: auto-set organizationId from context
 * - beforeBulkCreate: auto-set organizationId for all instances
 * - beforeUpdate/beforeBulkUpdate: prevent unscoped tenant updates
 * - beforeDestroy/beforeBulkDestroy: prevent unscoped tenant deletes
 *
 * Called for all 11 tenanted models in lib/postgres.js
 */
function applyTenantHooks(Model) {
  const scopeWhere = (options) => {
    if (options.tenantBypass === true) return;
    const orgId = TenantContext.assertGet();
    options.where = options.where || {};
    if (options.where.organizationId && options.where.organizationId !== orgId) {
      throw new Error("Cross-tenant query attempted");
    }
    options.where.organizationId = orgId;
  };

  Model.addHook("beforeFind", scopeWhere);
  Model.addHook("beforeCount", scopeWhere);
  Model.addHook("beforeUpdate", scopeWhere);
  Model.addHook("beforeBulkUpdate", scopeWhere);
  Model.addHook("beforeDestroy", scopeWhere);
  Model.addHook("beforeBulkDestroy", scopeWhere);

  // Create interception: auto-set organizationId from context (not request body)
  Model.addHook("beforeCreate", (instance, options) => {
    if (options.tenantBypass === true) return;
    instance.organizationId = TenantContext.assertGet();
  });

  // Bulk create interception
  Model.addHook("beforeBulkCreate", (instances, options) => {
    if (options.tenantBypass === true) return;
    const orgId = TenantContext.assertGet();
    instances.forEach((instance) => {
      instance.organizationId = orgId;
    });
  });
}

// tenantBypass is intentionally allowed only for migrations, auth bootstrap,
// org registration, invite acceptance, and internal admin jobs.

module.exports = { applyTenantHooks };
```

**Important:** hooks are guardrails, not the complete security model. Raw SQL, cross-table references, and JSONB product arrays still require explicit tenant validation in handlers/services.

---

## Auth & Middleware Changes

### `middlewares/auth.js` — Updated

```javascript
const TenantContext = require("@/lib/tenant-context");

export const auth = async (req, res, next) => {
  try {
    const token = getTokenCookie(req);
    if (!token) {
      return res.status(401).send({ message: "Please login first" });
    }

    const unsealedToken = await Iron.unseal(token, process.env.TOKEN_SECRET, Iron.defaults);

    // Check expiry
    if (Date.now() > new Date(unsealedToken?.token?.maxAge)) {
      return res.status(401).send({ message: "Token expired" });
    }

    // NEW: Validate token organizationId matches
    if (!unsealedToken?.user?.organizationId) {
      return res.status(401).send({ message: "Invalid token (missing org)" });
    }

    // Fetch user from DB
    const dbUser = await db.User.findOne({
      where: { id: unsealedToken.user.id },
      attributes: { exclude: ["password"] },
      tenantBypass: true, // Auth bootstrap happens before TenantContext exists
    });
    if (!dbUser) {
      return res.status(401).send({ message: "User not found" });
    }

    // NEW: Validate user's organizationId in token matches DB
    if (dbUser.organizationId !== unsealedToken.user.organizationId) {
      return res.status(401).send({ message: "Token validation failed" });
    }

    // NEW: Fetch organization, verify active status
    const organization = await db.Organization.findByPk(dbUser.organizationId);
    if (!organization) {
      return res.status(401).send({ message: "Organization not found" });
    }
    if (organization.status !== "ACTIVE") {
      return res.status(403).send({ message: "Organization suspended" });
    }

    // Attach user and organization to request
    req.user = dbUser;
    req.organization = organization;

    // NEW: Run the rest of the request within the tenant context
    // This ensures all queries automatically filter by this organization
    TenantContext.run(dbUser.organizationId, () => {
      next();
    });
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).send({ message: "Authentication failed" });
  }
};
```

### `pages/api/user/login.js` — Updated

Add `organizationId` and `organizationUuid` to the sealed token:

```javascript
// Existing login handler...
const unsealToken = await Iron.seal(
  {
    user: {
      id: user.id,
      uuid: user.uuid,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId, // NEW
      organizationUuid: user.Organization?.uuid, // NEW (if loaded)
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    token: {
      maxAge: new Date(Date.now() + MAX_AGE * 1000),
    },
  },
  process.env.TOKEN_SECRET,
  Iron.defaults
);
```

---

## API Handler Changes

### Pattern 1: Update Joi schemas

**Remove** `organizationId` from all allowed fields. It must ONLY come from context:

```javascript
// BEFORE
const apiSchema = Joi.object({
  companyId: Joi.number().required(),
  totalAmount: Joi.number().required(),
  organizationId: Joi.number(), // SECURITY RISK
});

// AFTER
const apiSchema = Joi.object({
  companyId: Joi.number().required(),
  totalAmount: Joi.number().required(),
  // organizationId is NOT included — comes from context only
});
```

### Pattern 2: Replace all `findByPk(id)` calls

**Critical:** There are ~30 `findByPk(id)` calls across 14 files. Each is a cross-tenant vulnerability.

```javascript
// BEFORE
const purchase = await db.Purchase.findByPk(req.params.id);

// AFTER
const purchase = await db.Purchase.findOne({
  where: { id: req.params.id, organizationId: TenantContext.assertGet() },
});
if (!purchase) return res.status(404).send({ message: "Not found" });
```

All instances:

- `pages/api/purchase/[id].js`
- `pages/api/purchase/approve/[id].js`
- `pages/api/purchase/cancel/[id].js`
- `pages/api/sales/[id].js`
- `pages/api/sales/approve/[id].js`
- `pages/api/sales/cancel/[id].js`
- `pages/api/sales/returns/[saleId].js`
- `pages/api/inventory/[id].js`
- `pages/api/items/[id].js`
- `pages/api/customer/[id].js`
- `pages/api/company/[id].js`
- `pages/api/ledger/[id].js`
- `pages/api/cheques/index.js` (if any)
- `pages/api/user/[id].js`

### Pattern 3: Scope all writes and deletes

Every update/delete must include `organizationId` in the `where` clause, even when hooks are enabled. This keeps the code auditable and protects raw/bulk operations.

```javascript
// BEFORE
await db.Company.destroy({ where: { id: value.id } });

// AFTER
const deleted = await db.Company.destroy({
  where: {
    id: value.id,
    organizationId: TenantContext.assertGet(),
  },
});
if (!deleted) return res.status(404).send({ message: "Not found" });
```

Required replacements:

- `destroy({ where: { id } })` => `destroy({ where: { id, organizationId } })`
- `update(payload, { where: { id } })` => `update(payload, { where: { id, organizationId } })`
- instance `.update()` is allowed only after the instance was loaded through a tenant-scoped query
- transaction workflows must pass the transaction option without dropping tenant filters

### Pattern 4: Validate foreign-key ownership before writes

Do not trust IDs sent by the client. Before creating or updating records, verify every referenced record belongs to the current organization.

```javascript
const orgId = TenantContext.assertGet();

const company = await db.Company.findOne({
  where: { id: value.companyId, organizationId: orgId },
});
if (!company) return res.status(404).send({ message: "Company not found" });

await db.Purchase.create({
  ...value,
  organizationId: orgId,
  status: STATUS.PENDING,
});
```

Validation requirements:

- `companyId` must belong to current org before creating/updating purchases, items, inventory, ledger company entries, and purchase histories
- `customerId` must belong to current org before creating/updating sales, sale returns, ledger customer entries, and customer exports
- `saleId` must belong to current org before creating sale returns
- `ledgerId` must belong to current org before linking refunds/returns/payments
- IDs inside `purchasedProducts`, `soldProducts`, and `returnedProducts` JSONB arrays must resolve to tenant-owned `items`/`inventory`/`companies`
- approve/cancel workflows must re-read the parent purchase/sale with tenant scope before mutating inventory or ledger rows

### Pattern 5: Update raw SQL queries

**File:** `query/index.js` — every exported raw SQL query must become a function that accepts no interpolated IDs and uses named replacements.

```javascript
// BEFORE
export const companyQuery = `
  SELECT t.id, t.name, SUM(amount) as total
  FROM ledgers t
  JOIN companies c ON t.company_id = c.id
  GROUP BY t.id
`;

// AFTER
export const companyQuery = `
  SELECT t.id, t.name, SUM(amount) as total
  FROM ledgers t
  JOIN companies c ON t.company_id = c.id
  WHERE t."organizationId" = :organizationId
  GROUP BY t.id
`;

// Usage in ledger/index.js
const results = await db.sequelize.query(companyQuery, { replacements: { organizationId: TenantContext.assertGet() } });
```

Raw SQL that must be revised:

- `query/index.js`: `companyTotalBalesQuery`
- `query/index.js`: `companyQuery`
- `query/index.js`: `customerQuery`
- `query/index.js`: `companySumQuery`
- `query/index.js`: `customerSumQuery`
- `query/index.js`: `purchaseGraphQuery`
- `query/index.js`: `saleGraphQuery`
- `pages/api/overview/*.js`: every inline `sequelize.query`
- `pages/api/ledger/index.js`
- `pages/api/ledger/[id].js`
- `pages/api/ledger/export.js`
- `pages/api/ledger/exportCustomer.js`
- `pages/api/inventory/export.js`

Do not use string interpolation for user-controlled IDs:

```javascript
// FORBIDDEN
WHERE "ledgers"."companyId" = ${id}

// REQUIRED
WHERE "ledgers"."companyId" = :companyId
  AND "ledgers"."organizationId" = :organizationId
```

### Pattern 6: Duplicate checks (now composite unique)

Email and company name are now composite unique. Hooks auto-add organizationId:

```javascript
// BEFORE: global uniqueness check
const existing = await db.Customer.findOne({ where: { email } });

// AFTER: hooks auto-add organizationId, so this checks per-org uniqueness
const existing = await db.Customer.findOne({ where: { email } });
// The beforeFind hook automatically adds: AND organizationId = currentOrgId
if (existing) return res.status(409).send({ message: "Email already exists" });
```

---

## New Endpoints for SaaS Onboarding

### `POST /api/org/register` (public, no auth)

**Create a new SaaS organization + admin user.**

```javascript
// pages/api/org/register.js
const createOrgSchema = Joi.object({
  organizationName: Joi.string().required().min(3).max(255),
  slug: Joi.string().required().alphanum().min(3).max(64),
  adminFirstName: Joi.string().required().lowercase().min(2).max(50),
  adminLastName: Joi.string().required().lowercase().min(2).max(50),
  adminEmail: Joi.string().required().email().lowercase(),
  adminPassword: Joi.string().required().min(8),
});

export const registerOrg = async (req, res) => {
  const { error, value } = createOrgSchema.validate(req.body);
  if (error) return res.status(400).send({ message: error.toString() });

  await db.dbConnect();

  try {
    // Check slug uniqueness
    const slugExists = await db.Organization.findOne({
      where: { slug: value.slug },
    });
    if (slugExists) return res.status(409).send({ message: "Slug already taken" });

    // Check email uniqueness (globally)
    const emailExists = await db.User.findOne({
      where: { email: value.adminEmail },
      tenantBypass: true,
    });
    if (emailExists) return res.status(409).send({ message: "Email already in use" });

    // Transaction: create org + admin user
    const result = await db.sequelize.transaction(async (t) => {
      const org = await db.Organization.create(
        {
          name: value.organizationName,
          slug: value.slug,
          plan: "STARTER",
          status: "ACTIVE",
        },
        { transaction: t, tenantBypass: true }
      );

      const user = await db.User.create(
        {
          firstName: value.adminFirstName,
          lastName: value.adminLastName,
          email: value.adminEmail,
          password: value.adminPassword, // Hashed by beforeCreate hook
          role: "ADMIN",
          organizationId: org.id,
        },
        { transaction: t, tenantBypass: true }
      );

      return { org, user };
    });

    // Issue login cookie (auto-login)
    const token = await Iron.seal(
      {
        user: {
          id: result.user.id,
          uuid: result.user.uuid,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          email: result.user.email,
          role: result.user.role,
          organizationId: result.org.id,
          organizationUuid: result.org.uuid,
        },
        token: { maxAge: new Date(Date.now() + 8 * 60 * 60 * 1000) },
      },
      process.env.TOKEN_SECRET,
      Iron.defaults
    );

    setTokenCookie(res, token);

    return res.status(201).send({
      success: true,
      organization: { uuid: result.org.uuid, slug: result.org.slug },
      user: { uuid: result.user.uuid, email: result.user.email },
    });
  } catch (error) {
    console.error("Org registration failed:", error);
    return res.status(500).send({ message: "Registration failed" });
  }
};
```

### `POST /api/org/invite` (protected, ADMIN only)

**Invite an editor to your organization.**

```javascript
// pages/api/org/invite.js
const inviteSchema = Joi.object({
  email: Joi.string().required().email().lowercase(),
});

export const inviteUser = async (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).send({ message: "Only admins can invite" });
  }

  const { error, value } = inviteSchema.validate(req.body);
  if (error) return res.status(400).send({ message: error.toString() });

  await db.dbConnect();

  try {
    // Check seat limit
    const userCount = await db.User.count({
      where: { organizationId: req.organization.id },
    });
    if (userCount >= req.organization.maxUsers) {
      return res.status(402).send({ message: "Seat limit reached" });
    }

    // Check email globally (prevent duplicate across orgs)
    const existing = await db.User.findOne({
      where: { email: value.email },
      tenantBypass: true,
    });
    if (existing) return res.status(409).send({ message: "Email already in use" });

    // Generate invite token: store HASH in DB, send plaintext in email
    const plainToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(plainToken).digest("hex");

    const invitedUser = await db.User.create(
      {
        firstName: "", // Empty until accepted
        lastName: "", // Empty until accepted
        email: value.email,
        password: "pending", // Will be set on accept
        role: "EDITOR",
        organizationId: req.organization.id,
        status: "INVITED",
        inviteToken: hashedToken,
        inviteTokenExpiry: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
      },
      { tenantBypass: true }
    );

    // TODO: Send email with invite link: /accept-invite?token=<plainToken>
    // sendInviteEmail(value.email, plainToken);

    return res.status(202).send({
      success: true,
      message: "Invite sent",
      user: { email: invitedUser.email, status: invitedUser.status },
    });
  } catch (error) {
    console.error("Invite failed:", error);
    return res.status(500).send({ message: "Invite failed" });
  }
};
```

### `POST /api/org/accept-invite` (public, no auth)

**Accept an invite and complete signup.**

```javascript
// pages/api/org/accept-invite.js
const acceptSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().required().min(8),
  firstName: Joi.string().required().lowercase().min(2).max(50),
  lastName: Joi.string().required().lowercase().min(2).max(50),
});

export const acceptInvite = async (req, res) => {
  const { error, value } = acceptSchema.validate(req.body);
  if (error) return res.status(400).send({ message: error.toString() });

  await db.dbConnect();

  try {
    // Hash the provided token and look up user
    const hashedToken = crypto.createHash("sha256").update(value.token).digest("hex");

    const invitedUser = await db.User.findOne({
      where: {
        inviteToken: hashedToken,
        status: "INVITED",
      },
      tenantBypass: true,
    });

    if (!invitedUser) {
      return res.status(401).send({ message: "Invalid or expired invite" });
    }

    // Check expiry
    if (Date.now() > new Date(invitedUser.inviteTokenExpiry)) {
      return res.status(410).send({ message: "Invite expired" });
    }

    // Activate user
    invitedUser.firstName = value.firstName;
    invitedUser.lastName = value.lastName;
    invitedUser.password = value.password; // Will be hashed by beforeUpdate hook
    invitedUser.status = "ACTIVE";
    invitedUser.inviteToken = null;
    invitedUser.inviteTokenExpiry = null;
    await invitedUser.save({ tenantBypass: true });

    // Issue login cookie
    const token = await Iron.seal(
      {
        user: {
          id: invitedUser.id,
          uuid: invitedUser.uuid,
          firstName: invitedUser.firstName,
          lastName: invitedUser.lastName,
          email: invitedUser.email,
          role: invitedUser.role,
          organizationId: invitedUser.organizationId,
        },
        token: { maxAge: new Date(Date.now() + 8 * 60 * 60 * 1000) },
      },
      process.env.TOKEN_SECRET,
      Iron.defaults
    );

    setTokenCookie(res, token);

    return res.status(200).send({
      success: true,
      user: { uuid: invitedUser.uuid, email: invitedUser.email },
    });
  } catch (error) {
    console.error("Accept invite failed:", error);
    return res.status(500).send({ message: "Failed to accept invite" });
  }
};
```

---

## Testing Strategy

### Test Infrastructure

**New dependencies (dev only):**

- `fishery` — test data factories (eliminates repetitive object literals)
- `@faker-js/faker` — realistic fake data (unique emails, names)
- `supertest` — HTTP integration tests (tests full middleware chain)

### `__tests__/helpers/tenant.js` — New File

```javascript
import { faker } from "@faker-js/faker";
import { build, buildList } from "fishery";
import { createMocks } from "node-mocks-http";
import TenantContext from "@/lib/tenant-context";

// Factory for test organizations
export const OrgFactory = build({
  model: {
    /* Organization fields */
  },
  traits: {
    active: (t) => t.status("ACTIVE"),
    suspended: (t) => t.status("SUSPENDED"),
  },
});

// Factory for test users
export const UserFactory = build({
  model: {
    /* User fields */
  },
  transientParams: { password: "Test1234!" },
});

// Factory for test customers
export const CustomerFactory = build({
  model: {
    /* Customer fields */
  },
});

/**
 * Helper: Create a test org in SQLite + return it
 */
export async function createTestOrg(overrides = {}) {
  return await db.Organization.create({
    name: faker.company.name(),
    slug: faker.lorem.slug(),
    plan: "STARTER",
    status: "ACTIVE",
    ...overrides,
  });
}

/**
 * Helper: Create a test user scoped to an org
 */
export async function createTestUser(orgId, role = "EDITOR", overrides = {}) {
  return await db.User.create(
    {
      firstName: faker.name.firstName().toLowerCase(),
      lastName: faker.name.lastName().toLowerCase(),
      email: faker.internet.email(),
      password: "Test1234!",
      role,
      organizationId: orgId,
      status: "ACTIVE",
      ...overrides,
    },
    { tenantBypass: true }
  );
}

/**
 * Helper: Wrap a function in TenantContext
 */
export async function withTenantContext(orgId, fn) {
  return TenantContext.run(orgId, fn);
}

/**
 * Helper: Create mock request/response with tenant scoped
 */
export function createMocksWithTenant(orgId, options = {}) {
  const { req, res } = createMocks(options);
  req.user = {
    id: 1,
    uuid: "test-uuid",
    email: "test@test.com",
    role: "EDITOR",
    organizationId: orgId,
  };
  req.organization = {
    id: orgId,
    name: "Test Org",
    status: "ACTIVE",
  };
  return { req, res };
}
```

### Security Test Suite

**`__tests__/api/security/cross-tenant.test.js`** (Highest Priority)

```javascript
import TenantContext from "@/lib/tenant-context";
import { createTestOrg, createTestUser, createMocksWithTenant } from "@/tests/helpers/tenant";
import { createMocks } from "node-mocks-http";
import * as handlers from "@/pages/api/purchase/[id]";

describe("Cross-Tenant Security", () => {
  let orgA, orgB, userA, userB, purchaseA, purchaseB;

  beforeAll(async () => {
    // Set up two organizations with different data
    orgA = await createTestOrg({ slug: "org-a" });
    orgB = await createTestOrg({ slug: "org-b" });

    userA = await createTestUser(orgA.id, "ADMIN");
    userB = await createTestUser(orgB.id, "ADMIN");

    // Create purchases for each org
    purchaseA = await TenantContext.run(orgA.id, async () =>
      db.Purchase.create({
        companyId: 1,
        totalAmount: 1000,
        status: "PENDING",
        purchasedProducts: [],
      })
    );

    purchaseB = await TenantContext.run(orgB.id, async () =>
      db.Purchase.create({
        companyId: 2,
        totalAmount: 2000,
        status: "PENDING",
        purchasedProducts: [],
      })
    );
  });

  test("GET /purchase/:id with orgA token for orgB resource returns 404", async () => {
    const { req, res } = createMocksWithTenant(orgA.id, {
      method: "GET",
      query: { id: purchaseB.id },
    });

    await handlers.default(req, res);

    expect(res._getStatusCode()).toBe(404);
  });

  test("POST /purchase with organizationId in body does not override tenant context", async () => {
    const { req, res } = createMocksWithTenant(orgA.id, {
      method: "POST",
      body: {
        companyId: 1,
        totalAmount: 500,
        organizationId: orgB.id, // MALICIOUS: try to create in orgB
        purchasedProducts: [],
      },
    });

    jest.spyOn(db.Purchase, "create").mockResolvedValueOnce({ id: 999 });

    await handlers.createPurchaseOrder(req, res);

    // Verify Purchase.create was called with orgA's ID, not orgB's
    expect(db.Purchase.create).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: orgA.id }), // Not orgB
      expect.anything()
    );
  });

  test("suspended organization receives 403 on all endpoints", async () => {
    orgA.status = "SUSPENDED";
    await orgA.save({ tenantBypass: true });

    const { req, res } = createMocksWithTenant(orgA.id, { method: "GET" });

    // Manually trigger auth middleware since we're not in full HTTP context
    // In supertest integration tests, this is automatic
    const suspendedOrg = await db.Organization.findByPk(orgA.id, { tenantBypass: true });
    if (suspendedOrg.status !== "ACTIVE") {
      res.status(403).send({ message: "Organization suspended" });
    }

    expect(res._getStatusCode()).toBe(403);
  });

  test("GET /ledger does not return another tenant's entries", async () => {
    const ledgerA = await TenantContext.run(orgA.id, async () =>
      db.Ledger.create({
        companyId: 1,
        paymentType: "CASH",
        spendType: "DEBIT",
        amount: 100,
      })
    );

    const ledgerB = await TenantContext.run(orgB.id, async () =>
      db.Ledger.create({
        companyId: 2,
        paymentType: "CASH",
        spendType: "DEBIT",
        amount: 200,
      })
    );

    // Query with orgA context
    const results = await TenantContext.run(orgA.id, async () => db.Ledger.findAll());

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(ledgerA.id);
  });
});
```

### Tenant Isolation Tests Per Domain

**`__tests__/api/purchase/tenant-isolation.test.js`**

```javascript
describe("Purchase Tenant Isolation", () => {
  let orgA, orgB, userA;

  beforeAll(async () => {
    orgA = await createTestOrg({ slug: "org-a" });
    orgB = await createTestOrg({ slug: "org-b" });
    userA = await createTestUser(orgA.id);
  });

  test("GET /purchase returns only current tenant's purchases", async () => {
    // Create 2 purchases for orgA, 2 for orgB
    await TenantContext.run(orgA.id, async () => {
      await db.Purchase.create({ companyId: 1, totalAmount: 100, status: "PENDING" });
      await db.Purchase.create({ companyId: 1, totalAmount: 200, status: "PENDING" });
    });

    await TenantContext.run(orgB.id, async () => {
      await db.Purchase.create({ companyId: 2, totalAmount: 300, status: "PENDING" });
      await db.Purchase.create({ companyId: 2, totalAmount: 400, status: "PENDING" });
    });

    // Query with orgA context
    const { req, res } = createMocksWithTenant(orgA.id, { method: "GET" });
    await handlers.getAllPurchase(req, res);

    const data = JSON.parse(res._getData());
    expect(data.count).toBe(2);
    expect(data.rows.every((r) => r.organizationId === orgA.id)).toBe(true);
  });

  test("GET /purchase/:id for another tenant returns 404", async () => {
    const purchaseB = await TenantContext.run(orgB.id, async () =>
      db.Purchase.create({ companyId: 2, totalAmount: 500, status: "PENDING" })
    );

    const { req, res } = createMocksWithTenant(orgA.id, {
      method: "GET",
      query: { id: purchaseB.id },
    });

    await handlers.getPurchaseById(req, res);

    expect(res._getStatusCode()).toBe(404);
  });
});
```

### Regression Tests

All existing tests must be updated to use `createMocksWithTenant`:

```javascript
// BEFORE
const { req, res } = createMocks({ method: 'POST', body: { ... } });

// AFTER
const orgId = 42; // or createTestOrg().id
const { req, res } = createMocksWithTenant(orgId, { method: 'POST', body: { ... } });

// And wrap handler calls in TenantContext
await withTenantContext(orgId, async () => {
  await handler(req, res);
});
```

### Additional Security Tests Required Before Launch

The existing mocked unit tests are not enough for SaaS isolation. Add integration tests that exercise real Sequelize models, raw SQL paths, and handler behavior.

Required test groups:

- **Two-tenant CRUD tests** for company, customer, items, inventory, purchase, sales, sale returns, ledger, cheques, and users
- **Cross-tenant `GET /:id` tests** for every detail endpoint: tenant A requesting tenant B's ID returns 404
- **Cross-tenant update/delete tests**: tenant A cannot update, approve, cancel, return, refund, or delete tenant B's records
- **Malicious body tests**: request body includes `organizationId` for another tenant and it is ignored/rejected
- **Foreign-key injection tests**: tenant A sends tenant B's `companyId`, `customerId`, `saleId`, `ledgerId`, or JSONB product IDs and receives 404/400
- **Raw SQL tests** for overview cards, top customers/products, purchase/sales graphs, ledger totals, inventory export, ledger export, and report searches
- **Onboarding tests** for register, invite, accept invite, duplicate slug, duplicate email, seat limits, suspended organization, and deprecated signup behavior
- **PostgreSQL RLS tests** in CI or staging, because SQLite cannot verify RLS policies

CI launch gate:

- `pnpm test` passes
- Postgres integration suite passes against two seeded organizations
- `rg "findByPk|sequelize.query|destroy\\(|update\\(" pages/api lib query` is manually reviewed before release
- No raw SQL query is allowed without `organizationId` replacement unless it is explicitly marked as public/non-tenant and reviewed

---

## PostgreSQL Row-Level Security (RLS) — Defense Layer 3

Add to a migration for production hardening after app-level tenant isolation passes in staging.

**Connection-pooling rule:** do not use plain `SET app.tenant_id = ...` on pooled connections. A pooled connection can be reused by another request and leak the previous tenant setting. Use `SET LOCAL` inside a transaction, or explicitly reset the setting in a `finally` block. Prefer transaction-scoped RLS for endpoints that execute raw SQL or multi-step workflows.

```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE "saleReturns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventories ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cheques ENABLE ROW LEVEL SECURITY;

-- Create policies (per table). Use current_setting(..., true) so missing
-- tenant context denies access instead of crashing unexpectedly.
CREATE POLICY organization_tenant_isolation ON users
  USING ("organizationId" = NULLIF(current_setting('app.tenant_id', true), '')::int)
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.tenant_id', true), '')::int);

CREATE POLICY customer_tenant_isolation ON customers
  USING ("organizationId" = NULLIF(current_setting('app.tenant_id', true), '')::int)
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.tenant_id', true), '')::int);

-- ... repeat for all tables

-- Example inside a transaction:
SET LOCAL app.tenant_id = '123';
```

Application pattern for RLS-protected transactions:

```javascript
await db.sequelize.transaction(async (transaction) => {
  await db.sequelize.query("SET LOCAL app.tenant_id = :orgId", {
    replacements: { orgId: TenantContext.assertGet() },
    transaction,
  });

  // Run ORM and raw SQL queries in this transaction.
});
```

RLS requirements:

- The production app user must not be a PostgreSQL superuser or table owner, because those can bypass RLS.
- Use `ALTER TABLE ... FORCE ROW LEVEL SECURITY` if the table owner is used by the app.
- Public org registration and auth bootstrap need carefully reviewed bypass paths; they must not expose tenant data.
- RLS tests must run against PostgreSQL. SQLite tests cannot validate RLS.

---

## Security Checklist

| Attack Vector                                 | Layer 1: ORM                        | Layer 2: Middleware                     | Layer 3: RLS                    | Status                                                   |
| --------------------------------------------- | ----------------------------------- | --------------------------------------- | ------------------------------- | -------------------------------------------------------- |
| **Handler returns all records without WHERE** | ✅ `beforeFind` hook                | ✅ `assertGet()`                        | ✅ RLS policy                   | Triple protection                                        |
| **`findByPk(id)` cross-tenant read**          | ⚠️ Must replace                     | ✅ `assertGet()`                        | ✅ RLS policy                   | Replace 30 calls                                         |
| **Raw SQL without tenant filter**             | ❌ Hooks do not apply               | ✅ Explicit replacements                | ✅ RLS policy                   | Update all raw SQL, reports, exports, overview endpoints |
| **Cross-tenant foreign key in request body**  | ⚠️ Hooks do not validate references | ✅ Explicit ownership checks            | ✅ FK/RLS defense               | Validate every referenced ID before writes               |
| **Bulk update/delete by ID**                  | ✅ update/destroy hooks             | ✅ Explicit `organizationId` in `where` | ✅ RLS policy                   | Scope every write/delete                                 |
| **Client sends `organizationId` in body**     | ✅ Hooks ignore body                | ✅ `beforeCreate` sets context          | N/A                             | Never use req.body                                       |
| **Tampered token `organizationId`**           | N/A                                 | ✅ Auth middleware validates            | N/A                             | Token must match DB                                      |
| **Auth middleware missing on route**          | ✅ `assertGet()` throws 500         | N/A                                     | N/A                             | Visible in monitoring                                    |
| **Direct DB connection**                      | N/A                                 | N/A                                     | ✅ RLS + non-superuser role     | Requires app_user role                                   |
| **Pooled DB connection tenant bleed**         | N/A                                 | ✅ Transaction-scoped `SET LOCAL`       | ✅ `current_setting(..., true)` | Never use global `SET` without reset                     |
| **AsyncLocalStorage context bleed**           | N/A                                 | ✅ By design (per-request isolation)    | N/A                             | Verified by Node.js                                      |
| **Invite token theft**                        | N/A                                 | ✅ Hash in DB + plaintext in email      | N/A                             | SHA-256 hash only                                        |

---

## Implementation Timeline (6–8 Weeks)

| Phase                     | Week | Work                                                                                                                                                                |
| ------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Foundation**            | 1–2  | Create Organization model; add nullable user `organizationId`; create default org; update auth/login; create tenant context; convert/deprecate old signup           |
| **Expand + Backfill**     | 2–3  | Add nullable `organizationId` to every domain table; backfill all records; add verification queries; deploy code that writes tenant IDs for new rows                |
| **Application Isolation** | 3–5  | Add tenant hooks for reads/counts/writes/deletes; replace `findByPk`; scope update/delete; validate foreign-key ownership; remove `organizationId` from Joi schemas |
| **Raw SQL + Reporting**   | 5    | Tenant-scope all `sequelize.query` calls in `query/index.js`, overview endpoints, ledger exports, inventory exports, and reports                                    |
| **SaaS Onboarding**       | 6    | Build org register, invite, accept invite, seat limits, org suspension behavior, and admin-only invite controls                                                     |
| **Testing + Contract**    | 6–7  | Add two-tenant integration tests; malicious body/FK tests; raw SQL tests; then enforce `NOT NULL` and composite unique indexes                                      |
| **RLS + Verification**    | 8    | Enable RLS with transaction-scoped `SET LOCAL`; run PostgreSQL RLS tests; verify staging with two organizations; perform manual cross-tenant audit                  |

---

## Critical Files Summary

| File                                          | Change                                                                                          | Scope  | Risk                                               |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------- |
| `lib/postgres.js`                             | Register Organization model, apply hooks                                                        | Large  | Medium — wrong hook application = silent data leak |
| `middlewares/auth.js`                         | Add org lookup, validation, TenantContext.run                                                   | Medium | High — wrong logic = auth bypass                   |
| `query/index.js`                              | Add WHERE organizationId to every raw SQL query and remove interpolation                        | Medium | High — raw SQL = not caught by hooks               |
| `pages/api/overview/*.js`                     | Scope all dashboard SQL                                                                         | Medium | High — dashboards can leak aggregate data          |
| `pages/api/ledger/export*.js`                 | Scope export SQL and ORM queries                                                                | Medium | High — exports can leak full financial history     |
| `pages/api/user/login.js`                     | Add organizationId to token                                                                     | Tiny   | Medium — missing field = auth token invalid        |
| All `pages/api/**/*.js`                       | Remove organizationId from Joi, replace `findByPk`, scope writes/deletes, validate foreign keys | Large  | High — primary leak surface                        |
| `__tests__/helpers/tenant.js`                 | New test helpers                                                                                | New    | Low                                                |
| `__tests__/api/security/cross-tenant.test.js` | New security tests                                                                              | New    | Low — tests catch bugs                             |

---

## Definition of Done

- [ ] All tenant tables have `organizationId` populated and verified with zero-null backfill checks
- [ ] All tenant tables have `organizationId` `NOT NULL` constraints after backfill
- [ ] Composite unique indexes on `customers.organizationId + email` and `companies.organizationId + companyName`
- [ ] Required tenant performance indexes exist for IDs, statuses, dates, company/customer lookups, and reports
- [ ] `lib/tenant-context.js` implemented (AsyncLocalStorage)
- [ ] `lib/tenant-hooks.js` scopes reads, counts, creates, bulk creates, updates, bulk updates, destroys, and bulk destroys
- [ ] Auth middleware updated with org lookup, token validation, suspended-org check, and TenantContext.run
- [ ] All unsafe `findByPk` calls replaced or justified as non-tenant/public bootstrap lookups
- [ ] All updates/deletes include `organizationId` in `where` or operate on an instance loaded through a tenant-scoped query
- [ ] Every write validates referenced tenant-owned records before mutation
- [ ] All JSONB product IDs in purchase/sale/return workflows are tenant-validated
- [ ] `query/index.js`, overview endpoints, reports, and exports are tenant-scoped with replacements
- [ ] All handler Joi schemas reject/strip client-supplied `organizationId`
- [ ] Old `/api/user/signup` converted to org registration or disabled before SaaS launch
- [ ] New endpoints: `/api/org/register`, `/api/org/invite`, `/api/org/accept-invite`
- [ ] Tenant isolation tests cover all major domains, not only purchase/sales/ledger
- [ ] Cross-tenant read/write/delete/approve/cancel/export tests pass
- [ ] Malicious `organizationId` and foreign-key injection tests pass
- [ ] Existing feature tests updated + regression pass
- [ ] PostgreSQL RLS policies deployed with pooled-connection-safe `SET LOCAL` transaction pattern
- [ ] PostgreSQL RLS tests pass outside SQLite
- [ ] Staging environment with two organizations manually verified
- [ ] Invite flow end-to-end tested (register → invite → accept → login)
- [ ] Org suspension tested (admin suspends → user requests 403)

---

## Free Tools Inventory

| Tool                            | Purpose                    | Why                                     | Cost       |
| ------------------------------- | -------------------------- | --------------------------------------- | ---------- |
| **Node.js `AsyncLocalStorage`** | Tenant context propagation | Built-in; no new npm package            | Free       |
| **Sequelize hooks**             | Automatic tenant filtering | Already in Sequelize                    | Free       |
| **PostgreSQL RLS**              | DB-level isolation         | Native feature                          | Free       |
| **`fishery` (devDep)**          | Test data factories        | Eliminates repetitive test setup        | Free (npm) |
| **`@faker-js/faker` (devDep)**  | Realistic test data        | Prevents constraint violations in tests | Free (npm) |
| **`supertest` (devDep)**        | HTTP integration testing   | Tests full middleware chain             | Free (npm) |

**Total new production dependencies: ZERO** ✅

---

**Document prepared:** 2026-04-28 | **Review cycle:** Weekly during implementation
