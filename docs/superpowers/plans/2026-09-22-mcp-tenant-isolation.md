# MCP Server Tenant Isolation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the cross-tenant data leak in the AI chatbot's MCP server, where every tool query reads across all organizations with no `organizationId` filter and no RLS session variable set.

**Architecture:** `lib/claude-service.js` reads the authenticated caller's `organizationId` from `TenantContext` (already set by `middlewares/auth.js` for the HTTP request) and injects it — server-side, after the model's own arguments, so it always wins — into every MCP `callTool()` invocation. `mcp-server/index.js` requires that `organizationId` on every tool call, filters every SQL query by it, and additionally runs each query inside a short transaction with `SET LOCAL app.tenant_id` so Postgres RLS enforces the same boundary as a second, independent layer — mirroring the app's existing `lib/tenant-transaction.js` pattern. A new script, `scripts/verify-mcp-tenant-scoping.js`, seeds two throwaway organizations, drives the real MCP server over stdio, and asserts no tool ever returns or accepts data across the org boundary.

**Tech Stack:** Node.js (CommonJS) for the MCP server and verification script, `pg` for raw SQL, `@modelcontextprotocol/sdk` for the MCP client/server, Sequelize for the verification script's setup/teardown, Jest (`next/jest`) for the `lib/claude-service.js` unit test.

## Global Constraints

- Every SQL query in `mcp-server/index.js` that reads `inventories`, `sales`, `purchases`, `customers`, or `companies` MUST filter by `organizationId` — no exceptions, including LEFT JOINs onto `companies`/`customers`.
- `organizationId` must NEVER appear in a tool's public `inputSchema` in `TOOLS` — the model must never see it as a settable parameter. `lib/claude-service.js` injects it after spreading the model's own arguments, so it always overwrites anything the model (possibly via prompt injection) tries to set.
- In every `case` handler in `mcp-server/index.js`, the FIRST line must be `const organizationId = requireOrgId(args);` — before any other argument validation — so a missing `organizationId` is rejected uniformly across all 15 tools regardless of what other args are required.
- Every query that used to call `pool.query(...)` must call `queryTenant(organizationId, ...)` instead, for RLS defense-in-depth (matches `lib/tenant-transaction.js`'s `SET LOCAL app.tenant_id` pattern used everywhere else in this app).
- Reuse the existing `normCol`, `normalizeSearch`, and `getDateFilter` helpers already in `mcp-server/index.js` — do not duplicate them.
- The new verification script must delete every row/organization it creates, even on failure (`try`/`finally`), and must not depend on pre-existing seed data.
- No change to the _shape_ of any tool's returned JSON — only to which rows are included. Existing formatting/column names stay identical so `SYSTEM_PROMPT`'s data-integrity rules in `lib/claude-service.js` keep holding.

---

## File Structure

- **Modify: `mcp-server/index.js`** — add `queryTenant` (transaction-wrapped query helper) and `requireOrgId` (guard) near the top; every tool `case` gains an `organizationId` guard and an `AND "organizationId" = $N` filter (plus a matching filter on any joined tenant table).
- **Modify: `lib/claude-service.js`** — import `TenantContext`; capture `organizationId` once per `chat()` call; merge it into every tool call's arguments, last, so it can't be overridden.
- **Create: `scripts/verify-mcp-tenant-scoping.js`** — standalone Node script (same style as `scripts/verify-rls.js`/`scripts/seed-demo-organization.js`) that seeds two orgs, drives the real MCP server over stdio, and asserts isolation. Built up incrementally across Tasks 1–4 and 6.
- **Create: `__tests__/lib/claude-service.test.js`** — Jest unit test proving the trusted-injection/overwrite behavior in `lib/claude-service.js` without needing a live MCP subprocess or Anthropic API call.
- **Modify: `package.json`** — add a `db:verify-mcp-tenant` script entry.
- **Modify: `CLAUDE.md`** — document the fix under the Tenant Safety Rules section so future agents know the MCP server is now in scope for tenant audits.

---

### Task 1: Guard scaffolding + reference tool (`list_all_inventory`)

**Files:**

- Modify: `mcp-server/index.js`
- Create: `scripts/verify-mcp-tenant-scoping.js`

**Interfaces:**

- Produces: `queryTenant(organizationId, sql, params)` — async, returns `{ rows }` like `pool.query`. `requireOrgId(args)` — returns a validated positive integer `organizationId` or throws. Later tasks in `mcp-server/index.js` call both.
- Produces (script): `callTool(mcpClient, name, args)` → `{ isError, text, data }`, `assertTrue(condition, message)`, `setup()` → `{ orgA, orgB, mcpClient }`, `teardown({ orgA, orgB, mcpClient })`, `VERIFICATIONS` array of verify functions, `main()`. Later tasks append to `VERIFICATIONS` and add new verify functions.

- [ ] **Step 1: Add `queryTenant` and `requireOrgId` to `mcp-server/index.js`**

Insert immediately after the `getDateFilter` function (currently ending around line 302, right before `server.setRequestHandler(ListToolsRequestSchema, ...)`):

```js
// Runs `sql` inside a short transaction with app.tenant_id set, so Postgres RLS
// enforces the same tenant boundary as the explicit organizationId filters below —
// belt-and-suspenders, matching lib/tenant-transaction.js's SET LOCAL pattern.
async function queryTenant(organizationId, sql, params = []) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL app.tenant_id = $1", [String(organizationId)]);
    const result = await client.query(sql, params);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// Every tool handler must call this FIRST, before any other argument validation.
// organizationId is never part of a tool's public inputSchema — it is injected
// server-side by lib/claude-service.js from TenantContext, never chosen by the model.
function requireOrgId(args) {
  const organizationId = Number(args.organizationId);
  if (!Number.isInteger(organizationId) || organizationId <= 0) {
    throw new Error("Missing or invalid organizationId — this tool must be called with a trusted tenant id");
  }
  return organizationId;
}
```

- [ ] **Step 2: Scope `list_all_inventory` as the reference implementation**

Replace the `list_all_inventory` case (currently lines 334–352):

```js
      // ── list_all_inventory ────────────────────────────────────────────────
      case "list_all_inventory": {
        const organizationId = requireOrgId(args);
        await context.info("Querying all inventory items…");
        await context.report_progress(0, 1);
        const limit = args.limit || 50;
        const offset = args.offset || 0;
        const { rows } = await queryTenant(
          organizationId,
          `SELECT i.id, i."itemName", i."noOfBales" AS "totalBalesPurchased", i."onHand" AS "currentStockOnHand",
                  i."baleWeightLbs", i."baleWeightKgs",
                  i."ratePerLbs", i."ratePerKgs", i."ratePerBale",
                  c."companyName" AS "companyName"
           FROM inventories i
           LEFT JOIN companies c ON i."companyId" = c.id AND c."organizationId" = $1
           WHERE i."organizationId" = $1
           ORDER BY i."itemName"
           LIMIT $2 OFFSET $3`,
          [organizationId, limit, offset]
        );
        await context.report_progress(1, 1);
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }
```

- [ ] **Step 3: Run the app locally against a real Postgres to sanity-check the syntax**

Run: `POSTGRES_DB=inventory-management-local node -e "require('./mcp-server/index.js')"` and Ctrl+C after it prints `Inventory MCP Server running on stdio` (confirms no syntax errors before writing the verification script).
Expected: `Inventory MCP Server running on stdio` printed to stderr, no crash.

- [ ] **Step 4: Create `scripts/verify-mcp-tenant-scoping.js` with setup/teardown and the guard test**

```js
#!/usr/bin/env node
"use strict";
require("dotenv").config();

const path = require("path");
const crypto = require("crypto");
const Sequelize = require("sequelize");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");

const env = process.env.NODE_ENV || "development";
const config = require("../config/config.js")[env];
const sequelize = new Sequelize(config.database, config.username, config.password, config);

const RUN_ID = Date.now();

async function createOrgWithData(tag) {
  const uniq = `${tag.toLowerCase()}-${RUN_ID}`;
  const now = new Date();

  const [org] = await sequelize.query(
    `INSERT INTO organizations (uuid, name, slug, plan, status, "maxUsers", "createdAt", "updatedAt")
     VALUES (:uuid, :name, :slug, 'STARTER', 'ACTIVE', 5, :now, :now) RETURNING id`,
    {
      replacements: { uuid: crypto.randomUUID(), name: `MCP Verify ${tag} ${RUN_ID}`, slug: `mcp-verify-${uniq}`, now },
      type: Sequelize.QueryTypes.SELECT,
    }
  );

  const [company] = await sequelize.query(
    `INSERT INTO companies (uuid, "companyName", "organizationId", "createdAt", "updatedAt")
     VALUES (:uuid, :name, :organizationId, :now, :now) RETURNING id`,
    {
      replacements: { uuid: crypto.randomUUID(), name: `${tag} Supplier ${RUN_ID}`, organizationId: org.id, now },
      type: Sequelize.QueryTypes.SELECT,
    }
  );

  const firstName = tag === "OrgA" ? "alicetest" : "bobtestxx";
  const [customer] = await sequelize.query(
    `INSERT INTO customers (uuid, "firstName", "lastName", email, "organizationId", "createdAt", "updatedAt")
     VALUES (:uuid, :firstName, 'verify', :email, :organizationId, :now, :now) RETURNING id`,
    {
      replacements: {
        uuid: crypto.randomUUID(),
        firstName,
        email: `${uniq}@mcp-verify.test`,
        organizationId: org.id,
        now,
      },
      type: Sequelize.QueryTypes.SELECT,
    }
  );

  const itemName = `${uniq}-fabric`;
  const [inventoryItem] = await sequelize.query(
    `INSERT INTO inventories (uuid, "companyId", "itemName", "noOfBales", "onHand", "ratePerBale", "organizationId", "createdAt", "updatedAt")
     VALUES (:uuid, :companyId, :itemName, 100, 5, 5000, :organizationId, :now, :now) RETURNING id`,
    {
      replacements: { uuid: crypto.randomUUID(), companyId: company.id, itemName, organizationId: org.id, now },
      type: Sequelize.QueryTypes.SELECT,
    }
  );

  const purchaseProducts = JSON.stringify([{ itemName, noOfBales: 10, ratePerBale: 5000 }]);
  await sequelize.query(
    `INSERT INTO purchases (uuid, "companyId", "totalAmount", "purchasedProducts", status, "purchaseDate", "organizationId", "createdAt", "updatedAt")
     VALUES (:uuid, :companyId, 50000, :products, 'APPROVED', :now, :organizationId, :now, :now)`,
    {
      replacements: {
        uuid: crypto.randomUUID(),
        companyId: company.id,
        products: purchaseProducts,
        organizationId: org.id,
        now,
      },
    }
  );

  const saleProducts = JSON.stringify([{ itemName, noOfBales: 10, ratePerBale: 8000 }]);
  await sequelize.query(
    `INSERT INTO sales (uuid, "customerId", "totalAmount", "soldProducts", status, "soldDate", "organizationId", "createdAt", "updatedAt")
     VALUES (:uuid, :customerId, 80000, :products, 'APPROVED', :now, :organizationId, :now, :now)`,
    {
      replacements: {
        uuid: crypto.randomUUID(),
        customerId: customer.id,
        products: saleProducts,
        organizationId: org.id,
        now,
      },
    }
  );

  return {
    id: org.id,
    companyId: company.id,
    companyName: `${tag} Supplier ${RUN_ID}`,
    customerId: customer.id,
    customerFirstName: firstName,
    inventoryId: inventoryItem.id,
    itemName,
  };
}

async function setup() {
  await sequelize.authenticate();
  const orgA = await createOrgWithData("OrgA");
  const orgB = await createOrgWithData("OrgB");

  const serverPath = path.join(__dirname, "..", "mcp-server", "index.js");
  const transport = new StdioClientTransport({ command: "node", args: [serverPath] });
  const mcpClient = new Client({ name: "verify-mcp-tenant-scoping", version: "1.0.0" }, { capabilities: {} });
  await mcpClient.connect(transport);

  return { orgA, orgB, mcpClient };
}

async function teardown({ orgA, orgB, mcpClient } = {}) {
  await mcpClient?.close();
  for (const org of [orgA, orgB]) {
    if (!org) continue;
    await sequelize.query(`DELETE FROM purchases WHERE "organizationId" = :id`, { replacements: { id: org.id } });
    await sequelize.query(`DELETE FROM sales WHERE "organizationId" = :id`, { replacements: { id: org.id } });
    await sequelize.query(`DELETE FROM inventories WHERE "organizationId" = :id`, { replacements: { id: org.id } });
    await sequelize.query(`DELETE FROM customers WHERE "organizationId" = :id`, { replacements: { id: org.id } });
    await sequelize.query(`DELETE FROM companies WHERE "organizationId" = :id`, { replacements: { id: org.id } });
    await sequelize.query(`DELETE FROM organizations WHERE id = :id`, { replacements: { id: org.id } });
  }
  await sequelize.close();
}

async function callTool(mcpClient, name, args) {
  const result = await mcpClient.callTool({ name, arguments: args });
  const text = result.content?.[0]?.text ?? "";
  return { isError: !!result.isError, text, data: result.isError ? null : JSON.parse(text) };
}

function assertTrue(condition, message) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

async function verifyGuardRejectsMissingOrgId({ mcpClient }) {
  const result = await callTool(mcpClient, "list_all_inventory", { limit: 5 });
  assertTrue(result.isError, "list_all_inventory without organizationId should return isError");
  assertTrue(/organizationId/i.test(result.text), `error message should mention organizationId, got: ${result.text}`);
}

const VERIFICATIONS = [verifyGuardRejectsMissingOrgId];

async function main() {
  const { orgA, orgB, mcpClient } = await setup();
  try {
    for (const verify of VERIFICATIONS) {
      process.stdout.write(`▶ ${verify.name} … `);
      await verify({ orgA, orgB, mcpClient });
      console.log("✓");
    }
    console.log("\nAll MCP tenant-scoping checks passed.");
  } finally {
    await teardown({ orgA, orgB, mcpClient });
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { setup, teardown, callTool, assertTrue, VERIFICATIONS };
```

- [ ] **Step 5: Run it to verify the guard test passes against the reference tool**

Run: `node scripts/verify-mcp-tenant-scoping.js`
Expected: `▶ verifyGuardRejectsMissingOrgId … ✓` then `All MCP tenant-scoping checks passed.`, exit code 0. (Requires a running local Postgres — `docker-compose up -d` — and `.env` pointed at it, per [[env_points_at_production_supabase]] in project memory: never point this at Supabase.)

- [ ] **Step 6: Commit**

```bash
git add mcp-server/index.js scripts/verify-mcp-tenant-scoping.js
git commit -m "feat: add tenant-scoping guard to MCP server, scope list_all_inventory"
```

---

### Task 2: Scope the remaining inventory tools

**Files:**

- Modify: `mcp-server/index.js`
- Modify: `scripts/verify-mcp-tenant-scoping.js`

**Interfaces:**

- Consumes: `queryTenant`, `requireOrgId` from Task 1.
- Produces: `verifyInventoryToolsScoped(ctx)`, appended to `VERIFICATIONS`.

- [ ] **Step 1: Scope `get_inventory_item`, `get_low_stock`, `search_inventory`**

Replace the three cases (currently lines 355–416):

```js
      // ── get_inventory_item ────────────────────────────────────────────────
      case "get_inventory_item": {
        const organizationId = requireOrgId(args);
        if (!args.id && !args.itemName) {
          return {
            content: [{ type: "text", text: "Provide id or itemName" }],
            isError: true,
          };
        }
        await context.info(`Looking up inventory item${args.itemName ? `: "${args.itemName}"` : ""}…`);
        await context.report_progress(0, 1);
        const query = args.id
          ? `SELECT i.id, i."itemName", i."noOfBales" AS "totalBalesPurchased", i."onHand" AS "currentStockOnHand",
                    i."baleWeightLbs", i."baleWeightKgs", i."ratePerLbs", i."ratePerKgs", i."ratePerBale",
                    c."companyName" AS "companyName"
             FROM inventories i
             LEFT JOIN companies c ON i."companyId" = c.id AND c."organizationId" = $1
             WHERE i.id = $2 AND i."organizationId" = $1`
          : `SELECT i.id, i."itemName", i."noOfBales" AS "totalBalesPurchased", i."onHand" AS "currentStockOnHand",
                    i."baleWeightLbs", i."baleWeightKgs", i."ratePerLbs", i."ratePerKgs", i."ratePerBale",
                    c."companyName" AS "companyName"
             FROM inventories i
             LEFT JOIN companies c ON i."companyId" = c.id AND c."organizationId" = $1
             WHERE ${normCol('i."itemName"')} LIKE $2 AND i."organizationId" = $1`;
        const param = args.id ? args.id : `%${normalizeSearch(args.itemName)}%`;
        const { rows } = await queryTenant(organizationId, query, [organizationId, param]);
        await context.report_progress(1, 1);
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }

      // ── get_low_stock ─────────────────────────────────────────────────────
      case "get_low_stock": {
        const organizationId = requireOrgId(args);
        await context.info(`Checking low-stock items (threshold: ${args.threshold || 10})…`);
        await context.report_progress(0, 1);
        const threshold = args.threshold || 10;
        const { rows } = await queryTenant(
          organizationId,
          `SELECT i.id, i."itemName", i."onHand" AS "currentStockOnHand", i."noOfBales" AS "totalBalesPurchased",
                  c."companyName" AS "companyName"
           FROM inventories i
           LEFT JOIN companies c ON i."companyId" = c.id AND c."organizationId" = $1
           WHERE i."onHand" < $2 AND i."organizationId" = $1
           ORDER BY i."onHand" ASC`,
          [organizationId, threshold]
        );
        await context.report_progress(1, 1);
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }

      // ── search_inventory ──────────────────────────────────────────────────
      case "search_inventory": {
        const organizationId = requireOrgId(args);
        await context.info(`Searching inventory for "${args.query}"…`);
        await context.report_progress(0, 1);
        const { rows } = await queryTenant(
          organizationId,
          `SELECT i.id, i."itemName", i."onHand" AS "currentStockOnHand", i."ratePerLbs",
                  i."ratePerKgs", i."ratePerBale",
                  c."companyName" AS "companyName"
           FROM inventories i
           LEFT JOIN companies c ON i."companyId" = c.id AND c."organizationId" = $1
           WHERE ${normCol('i."itemName"')} LIKE $2 AND i."organizationId" = $1
           ORDER BY i."itemName"`,
          [organizationId, `%${normalizeSearch(args.query)}%`]
        );
        await context.report_progress(1, 1);
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }
```

- [ ] **Step 2: Add the isolation test to `scripts/verify-mcp-tenant-scoping.js`**

Insert before `const VERIFICATIONS = [...]`:

```js
async function verifyInventoryToolsScoped({ orgA, orgB, mcpClient }) {
  const listA = await callTool(mcpClient, "list_all_inventory", { organizationId: orgA.id, limit: 100 });
  const namesA = listA.data.map((r) => r.itemName);
  assertTrue(namesA.includes(orgA.itemName), "orgA should see its own inventory item in list_all_inventory");
  assertTrue(!namesA.includes(orgB.itemName), "orgA must NOT see orgB's inventory item in list_all_inventory");

  const byId = await callTool(mcpClient, "get_inventory_item", { organizationId: orgB.id, id: orgA.inventoryId });
  assertTrue(byId.data.length === 0, "orgB must NOT be able to fetch orgA's inventory item by id");

  const byName = await callTool(mcpClient, "get_inventory_item", { organizationId: orgA.id, itemName: orgA.itemName });
  assertTrue(
    byName.data.length === 1 && byName.data[0].itemName === orgA.itemName,
    "orgA should find its own item by name"
  );

  const lowStockB = await callTool(mcpClient, "get_low_stock", { organizationId: orgB.id, threshold: 1000 });
  assertTrue(
    !lowStockB.data.some((r) => r.itemName === orgA.itemName),
    "orgB's get_low_stock must NOT include orgA's item"
  );

  const searchB = await callTool(mcpClient, "search_inventory", { organizationId: orgB.id, query: orgA.itemName });
  assertTrue(searchB.data.length === 0, "orgB searching for orgA's exact item name should find nothing");
}
```

Update `VERIFICATIONS`:

```js
const VERIFICATIONS = [verifyGuardRejectsMissingOrgId, verifyInventoryToolsScoped];
```

- [ ] **Step 3: Run it to verify all inventory checks pass**

Run: `node scripts/verify-mcp-tenant-scoping.js`
Expected: both `verifyGuardRejectsMissingOrgId` and `verifyInventoryToolsScoped` print `✓`; `All MCP tenant-scoping checks passed.`; exit code 0.

- [ ] **Step 4: Commit**

```bash
git add mcp-server/index.js scripts/verify-mcp-tenant-scoping.js
git commit -m "feat: scope remaining inventory MCP tools by organizationId"
```

---

### Task 3: Scope sales and customer tools

**Files:**

- Modify: `mcp-server/index.js`
- Modify: `scripts/verify-mcp-tenant-scoping.js`

**Interfaces:**

- Consumes: `queryTenant`, `requireOrgId`, `callTool`, `assertTrue` from Tasks 1–2.
- Produces: `verifySalesToolsScoped(ctx)`, appended to `VERIFICATIONS`.

- [ ] **Step 1: Scope `get_sales_history`, `get_sales_summary`, `get_revenue_report`, `get_item_sales_performance`, `get_customers`, `get_top_customers_by_sales`**

Replace the six cases (currently lines 419–652):

```js
      // ── get_sales_history ─────────────────────────────────────────────────
      case "get_sales_history": {
        const organizationId = requireOrgId(args);
        await context.info("Loading sales history…");
        await context.report_progress(0, 1);
        const limit = args.limit || 20;
        const conditions = [`s."organizationId" = $1`];
        const params = [organizationId];
        let idx = 2;

        if (args.date_from) {
          conditions.push(`s."soldDate" >= $${idx++}`);
          params.push(args.date_from);
        }
        if (args.date_to) {
          conditions.push(`s."soldDate" <= $${idx++}`);
          params.push(args.date_to);
        }
        if (args.customer_id) {
          conditions.push(`s."customerId" = $${idx++}`);
          params.push(args.customer_id);
        }
        if (args.status) {
          conditions.push(`s.status = $${idx++}`);
          params.push(args.status.toUpperCase());
        }

        params.push(limit);

        const { rows } = await queryTenant(
          organizationId,
          `SELECT s.id, s."totalAmount", s."laborCharge", s.status,
                  s."soldDate", s."soldProducts",
                  c."firstName" || ' ' || c."lastName" AS "customerName"
           FROM sales s
           LEFT JOIN customers c ON s."customerId" = c.id AND c."organizationId" = $1
           WHERE ${conditions.join(" AND ")}
           ORDER BY s."soldDate" DESC
           LIMIT $${idx}`,
          params
        );
        await context.report_progress(1, 1);
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }

      // ── get_sales_summary ─────────────────────────────────────────────────
      case "get_sales_summary": {
        const organizationId = requireOrgId(args);
        await context.info(`Loading sales summary (${args.period || "all time"})…`);
        await context.report_progress(0, 2);
        const period = args.period || "all";
        const fromDate = getDateFilter(period);
        const params = [organizationId];
        const dateWhere = fromDate
          ? (params.push(fromDate), `WHERE s."organizationId" = $1 AND s."soldDate" >= $2 AND s.status = 'APPROVED'`)
          : `WHERE s."organizationId" = $1 AND s.status = 'APPROVED'`;

        const { rows: totals } = await queryTenant(
          organizationId,
          `SELECT COUNT(*) AS "totalSales",
                  COALESCE(SUM(s."totalAmount"), 0) AS "totalRevenue",
                  COALESCE(SUM(s."laborCharge"), 0) AS "totalLaborCharges"
           FROM sales s ${dateWhere}`,
          params
        );

        await context.report_progress(1, 2);
        const { rows: topItems } = await queryTenant(
          organizationId,
          `SELECT item->>'itemName' AS "itemName",
                  SUM((item->>'noOfBales')::numeric) AS "totalBalesSold",
                  COUNT(*) AS "salesCount"
           FROM sales s, jsonb_array_elements(s."soldProducts") AS item
           ${dateWhere}
           GROUP BY item->>'itemName'
           ORDER BY "totalBalesSold" DESC
           LIMIT 5`,
          params
        );

        await context.report_progress(2, 2);
        return {
          content: [
            { type: "text", text: JSON.stringify({ period, ...totals[0], topSellingItems: topItems }, null, 2) },
          ],
        };
      }

      // ── get_revenue_report ────────────────────────────────────────────────
      case "get_revenue_report": {
        const organizationId = requireOrgId(args);
        await context.info(`Building revenue report (${args.period || "month"})…`);
        await context.report_progress(0, 2);
        const period = args.period || "month";
        const fromDate = getDateFilter(period);
        const params = [organizationId];
        const dateWhere = fromDate
          ? (params.push(fromDate), `WHERE s."organizationId" = $1 AND s."soldDate" >= $2 AND s.status = 'APPROVED'`)
          : `WHERE s."organizationId" = $1 AND s.status = 'APPROVED'`;

        const { rows: daily } = await queryTenant(
          organizationId,
          `SELECT DATE_TRUNC('day', s."soldDate") AS date,
                  COUNT(*) AS "salesCount",
                  SUM(s."totalAmount") AS revenue
           FROM sales s ${dateWhere}
           GROUP BY DATE_TRUNC('day', s."soldDate")
           ORDER BY date DESC
           LIMIT 30`,
          params
        );

        await context.report_progress(1, 2);
        const { rows: summary } = await queryTenant(
          organizationId,
          `SELECT COUNT(*) AS "totalTransactions",
                  COALESCE(SUM("totalAmount"), 0) AS "totalRevenue",
                  COALESCE(AVG("totalAmount"), 0) AS "averageSaleValue",
                  COALESCE(MAX("totalAmount"), 0) AS "highestSale"
           FROM sales s ${dateWhere}`,
          params
        );

        await context.report_progress(2, 2);
        return {
          content: [
            { type: "text", text: JSON.stringify({ period, summary: summary[0], dailyBreakdown: daily }, null, 2) },
          ],
        };
      }

      // ── get_item_sales_performance ────────────────────────────────────────
      case "get_item_sales_performance": {
        const organizationId = requireOrgId(args);
        await context.info(`Fetching sales performance for "${args.item_name}"…`);
        await context.report_progress(0, 1);
        const { rows } = await queryTenant(
          organizationId,
          `SELECT
            item->>'itemName' AS "itemName",
            SUM((item->>'noOfBales')::numeric) AS "totalBalesSold",
            COUNT(DISTINCT s.id) AS "totalOrders",
            SUM(
              COALESCE(NULLIF(item->>'ratePerBale', '')::numeric, 0)
              * (item->>'noOfBales')::numeric
            ) AS "revenueGenerated",
            MAX(s."soldDate") AS "lastSaleDate"
           FROM sales s, jsonb_array_elements(s."soldProducts") AS item
           WHERE s."organizationId" = $1
             AND ${normCol("item->>'itemName'")} LIKE $2
             AND s.status = 'APPROVED'
           GROUP BY item->>'itemName'`,
          [organizationId, `%${normalizeSearch(args.item_name)}%`]
        );
        await context.report_progress(1, 1);
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }

      // ── get_customers ─────────────────────────────────────────────────────
      case "get_customers": {
        const organizationId = requireOrgId(args);
        await context.info(args.search ? `Searching customers: "${args.search}"…` : "Loading customer list…");
        await context.report_progress(0, 1);
        const limit = args.limit || 20;
        const params = [organizationId];
        let searchClause = "";

        if (args.search) {
          params.push(`%${normalizeSearch(args.search)}%`);
          searchClause = ` AND (${normCol('c."firstName"')} LIKE $2 OR ${normCol('c."lastName"')} LIKE $2)`;
        }
        params.push(limit);

        const { rows } = await queryTenant(
          organizationId,
          `SELECT c.id, c."firstName", c."lastName", c.email, c.phone, c.address
           FROM customers c
           WHERE c."organizationId" = $1${searchClause}
           ORDER BY c."firstName"
           LIMIT $${params.length}`,
          params
        );
        await context.report_progress(1, 1);
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }

      // ── get_top_customers_by_sales ────────────────────────────────────────
      case "get_top_customers_by_sales": {
        const organizationId = requireOrgId(args);
        await context.info(`Ranking customers by ${args.rank_by || "revenue"}…`);
        await context.report_progress(0, 1);
        const limit = args.limit || 10;
        const period = args.period || "all";
        const rankBy = args.rank_by || "totalRevenue";
        const fromDate = getDateFilter(period);

        const params = [organizationId];
        const dateCond = fromDate ? (params.push(fromDate), `AND s."soldDate" >= $${params.length}`) : "";

        const orderCol =
          rankBy === "totalSales" ? '"totalSales"' : rankBy === "totalBales" ? '"totalBalesSold"' : '"totalRevenue"';

        params.push(limit);

        const { rows } = await queryTenant(
          organizationId,
          `WITH customer_revenue AS (
             SELECT s."customerId",
                    COUNT(s.id)::integer                    AS "totalSales",
                    COALESCE(SUM(s."totalAmount"), 0)       AS "totalRevenue",
                    COALESCE(SUM(s."laborCharge"), 0)       AS "totalLaborCharges",
                    MAX(s."soldDate")                        AS "lastSaleDate"
             FROM sales s
             WHERE s."organizationId" = $1 AND s.status = 'APPROVED' ${dateCond}
             GROUP BY s."customerId"
           ),
           customer_bales AS (
             SELECT s."customerId",
                    COALESCE(SUM((item->>'noOfBales')::numeric), 0) AS "totalBalesSold"
             FROM sales s
             CROSS JOIN jsonb_array_elements(s."soldProducts") AS item
             WHERE s."organizationId" = $1 AND s.status = 'APPROVED' ${dateCond}
             GROUP BY s."customerId"
           )
           SELECT cu.id AS "customerId",
                  cu."firstName" || ' ' || cu."lastName" AS "customerName",
                  COALESCE(cr."totalSales", 0)        AS "totalSales",
                  COALESCE(cr."totalRevenue", 0)      AS "totalRevenue",
                  COALESCE(cr."totalLaborCharges", 0) AS "totalLaborCharges",
                  COALESCE(cb."totalBalesSold", 0)    AS "totalBalesSold",
                  cr."lastSaleDate"
           FROM customers cu
           LEFT JOIN customer_revenue cr ON cr."customerId" = cu.id
           LEFT JOIN customer_bales   cb ON cb."customerId" = cu.id
           WHERE cu."organizationId" = $1
           ORDER BY ${orderCol} DESC
           LIMIT $${params.length}`,
          params
        );
        await context.report_progress(1, 1);
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }
```

- [ ] **Step 2: Add the isolation test to `scripts/verify-mcp-tenant-scoping.js`**

Insert before `const VERIFICATIONS = [...]`:

```js
async function verifySalesToolsScoped({ orgA, orgB, mcpClient }) {
  const historyB = await callTool(mcpClient, "get_sales_history", { organizationId: orgB.id, limit: 50 });
  assertTrue(
    !historyB.data.some((r) => (r.soldProducts || []).some((p) => p.itemName === orgA.itemName)),
    "orgB's get_sales_history must NOT include a sale of orgA's item"
  );

  const customersA = await callTool(mcpClient, "get_customers", { organizationId: orgA.id, limit: 100 });
  const namesA = customersA.data.map((c) => c.firstName);
  assertTrue(namesA.includes(orgA.customerFirstName), "orgA should see its own customer");
  assertTrue(!namesA.includes(orgB.customerFirstName), "orgA must NOT see orgB's customer");

  const topCustomersB = await callTool(mcpClient, "get_top_customers_by_sales", { organizationId: orgB.id, limit: 50 });
  assertTrue(
    !topCustomersB.data.some((c) => c.customerName?.includes(orgA.customerFirstName)),
    "orgB's get_top_customers_by_sales must NOT rank orgA's customer"
  );
}
```

Update `VERIFICATIONS`:

```js
const VERIFICATIONS = [verifyGuardRejectsMissingOrgId, verifyInventoryToolsScoped, verifySalesToolsScoped];
```

- [ ] **Step 3: Run it to verify all sales/customer checks pass**

Run: `node scripts/verify-mcp-tenant-scoping.js`
Expected: all three verifications print `✓`; `All MCP tenant-scoping checks passed.`; exit code 0.

- [ ] **Step 4: Commit**

```bash
git add mcp-server/index.js scripts/verify-mcp-tenant-scoping.js
git commit -m "feat: scope sales and customer MCP tools by organizationId"
```

---

### Task 4: Scope purchase, company, and profitability tools

**Files:**

- Modify: `mcp-server/index.js`
- Modify: `scripts/verify-mcp-tenant-scoping.js`

**Interfaces:**

- Consumes: `queryTenant`, `requireOrgId`, `callTool`, `assertTrue` from Tasks 1–3.
- Produces: `verifyPurchaseToolsScoped(ctx)`, appended to `VERIFICATIONS`.

- [ ] **Step 1: Scope the eight remaining tools**

Replace `get_purchase_history` (currently lines 655–696):

```js
      // ── get_purchase_history ──────────────────────────────────────────────
      case "get_purchase_history": {
        const organizationId = requireOrgId(args);
        await context.info("Loading purchase history…");
        await context.report_progress(0, 1);
        const limit = args.limit || 20;
        const conditions = [`p."organizationId" = $1`];
        const params = [organizationId];
        let idx = 2;

        if (args.date_from) {
          conditions.push(`p."purchaseDate" >= $${idx++}`);
          params.push(args.date_from);
        }
        if (args.date_to) {
          conditions.push(`p."purchaseDate" <= $${idx++}`);
          params.push(args.date_to);
        }
        if (args.company_id) {
          conditions.push(`p."companyId" = $${idx++}`);
          params.push(args.company_id);
        }
        if (args.status) {
          conditions.push(`p.status = $${idx++}`);
          params.push(args.status.toUpperCase());
        }

        params.push(limit);

        const { rows } = await queryTenant(
          organizationId,
          `SELECT p.id, p."totalAmount", p."surCharge", p."invoiceNumber",
                  p.status, p."baleType", p."purchaseDate", p."purchasedProducts",
                  c."companyName" AS "companyName"
           FROM purchases p
           LEFT JOIN companies c ON p."companyId" = c.id AND c."organizationId" = $1
           WHERE ${conditions.join(" AND ")}
           ORDER BY p."purchaseDate" DESC
           LIMIT $${idx}`,
          params
        );
        await context.report_progress(1, 1);
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }
```

Replace `get_purchase_summary` (currently lines 699–739):

```js
      // ── get_purchase_summary ──────────────────────────────────────────────
      case "get_purchase_summary": {
        const organizationId = requireOrgId(args);
        await context.info(`Loading purchase summary (${args.period || "all time"})…`);
        await context.report_progress(0, 2);
        const period = args.period || "all";
        const fromDate = getDateFilter(period);
        const params = [organizationId];
        const dateWhere = fromDate
          ? (params.push(fromDate), `WHERE p."organizationId" = $1 AND p."purchaseDate" >= $2 AND p.status = 'APPROVED'`)
          : `WHERE p."organizationId" = $1 AND p.status = 'APPROVED'`;

        const { rows: totals } = await queryTenant(
          organizationId,
          `SELECT COUNT(*) AS "totalPurchases",
                  COALESCE(SUM(p."totalAmount"), 0) AS "totalSpend",
                  COALESCE(SUM(p."surCharge"), 0) AS "totalSurcharges"
           FROM purchases p ${dateWhere}`,
          params
        );

        await context.report_progress(1, 2);
        const { rows: topItems } = await queryTenant(
          organizationId,
          `SELECT item->>'itemName' AS "itemName",
                  SUM((item->>'noOfBales')::numeric) AS "totalBalesPurchased",
                  COUNT(*) AS "purchaseCount"
           FROM purchases p, jsonb_array_elements(p."purchasedProducts") AS item
           ${dateWhere}
           GROUP BY item->>'itemName'
           ORDER BY "totalBalesPurchased" DESC
           LIMIT 5`,
          params
        );

        await context.report_progress(2, 2);
        return {
          content: [
            { type: "text", text: JSON.stringify({ period, ...totals[0], topPurchasedItems: topItems }, null, 2) },
          ],
        };
      }
```

Replace `get_purchase_spend_report` (currently lines 742–782):

```js
      // ── get_purchase_spend_report ─────────────────────────────────────────
      case "get_purchase_spend_report": {
        const organizationId = requireOrgId(args);
        await context.info(`Building purchase spend report (${args.period || "month"})…`);
        await context.report_progress(0, 2);
        const period = args.period || "month";
        const fromDate = getDateFilter(period);
        const params = [organizationId];
        const dateWhere = fromDate
          ? (params.push(fromDate), `WHERE p."organizationId" = $1 AND p."purchaseDate" >= $2 AND p.status = 'APPROVED'`)
          : `WHERE p."organizationId" = $1 AND p.status = 'APPROVED'`;

        const { rows: daily } = await queryTenant(
          organizationId,
          `SELECT DATE_TRUNC('day', p."purchaseDate") AS date,
                  COUNT(*) AS "purchaseCount",
                  SUM(p."totalAmount") AS spend
           FROM purchases p ${dateWhere}
           GROUP BY DATE_TRUNC('day', p."purchaseDate")
           ORDER BY date DESC
           LIMIT 30`,
          params
        );

        await context.report_progress(1, 2);
        const { rows: summary } = await queryTenant(
          organizationId,
          `SELECT COUNT(*) AS "totalTransactions",
                  COALESCE(SUM("totalAmount"), 0) AS "totalSpend",
                  COALESCE(AVG("totalAmount"), 0) AS "averagePurchaseValue",
                  COALESCE(MAX("totalAmount"), 0) AS "highestPurchase"
           FROM purchases p ${dateWhere}`,
          params
        );

        await context.report_progress(2, 2);
        return {
          content: [
            { type: "text", text: JSON.stringify({ period, summary: summary[0], dailyBreakdown: daily }, null, 2) },
          ],
        };
      }
```

Replace `get_item_purchase_performance` (currently lines 785–807):

```js
      // ── get_item_purchase_performance ─────────────────────────────────────
      case "get_item_purchase_performance": {
        const organizationId = requireOrgId(args);
        await context.info(`Fetching purchase performance for "${args.item_name}"…`);
        await context.report_progress(0, 1);
        const { rows } = await queryTenant(
          organizationId,
          `SELECT
            item->>'itemName' AS "itemName",
            SUM((item->>'noOfBales')::numeric) AS "totalBalesPurchased",
            COUNT(DISTINCT p.id) AS "totalOrders",
            SUM(
              COALESCE(NULLIF(item->>'ratePerBale', '')::numeric, 0)
              * (item->>'noOfBales')::numeric
            ) AS "totalSpend",
            MAX(p."purchaseDate") AS "lastPurchaseDate"
           FROM purchases p, jsonb_array_elements(p."purchasedProducts") AS item
           WHERE p."organizationId" = $1
             AND ${normCol("item->>'itemName'")} LIKE $2
             AND p.status = 'APPROVED'
           GROUP BY item->>'itemName'`,
          [organizationId, `%${normalizeSearch(args.item_name)}%`]
        );
        await context.report_progress(1, 1);
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }
```

Replace `get_top_purchasing_companies` (currently lines 810–861):

```js
      // ── get_top_purchasing_companies ──────────────────────────────────────
      case "get_top_purchasing_companies": {
        const organizationId = requireOrgId(args);
        await context.info(`Ranking companies by ${args.rank_by || "spend"}…`);
        await context.report_progress(0, 1);
        const limit = args.limit || 10;
        const period = args.period || "all";
        const rankBy = args.rank_by || "totalSpend";
        const fromDate = getDateFilter(period);

        const params = [organizationId];
        const dateCond = fromDate ? (params.push(fromDate), `AND p."purchaseDate" >= $${params.length}`) : "";

        const orderCol =
          rankBy === "totalPurchases" ? '"totalPurchases"' : rankBy === "totalBales" ? '"totalBales"' : '"totalSpend"';

        params.push(limit);

        const { rows } = await queryTenant(
          organizationId,
          `WITH company_spend AS (
             SELECT p."companyId",
                    COUNT(p.id)::integer                  AS "totalPurchases",
                    COALESCE(SUM(p."totalAmount"), 0)     AS "totalSpend",
                    COALESCE(SUM(p."surCharge"), 0)       AS "totalSurcharges"
             FROM purchases p
             WHERE p."organizationId" = $1 AND p.status = 'APPROVED' ${dateCond}
             GROUP BY p."companyId"
           ),
           company_bales AS (
             SELECT p."companyId",
                    COALESCE(SUM((item->>'noOfBales')::numeric), 0) AS "totalBales"
             FROM purchases p
             CROSS JOIN jsonb_array_elements(p."purchasedProducts") AS item
             WHERE p."organizationId" = $1 AND p.status = 'APPROVED' ${dateCond}
             GROUP BY p."companyId"
           )
           SELECT c.id AS "companyId",
                  c."companyName" AS "companyName",
                  COALESCE(cs."totalPurchases", 0)   AS "totalPurchases",
                  COALESCE(cs."totalSpend", 0)        AS "totalSpend",
                  COALESCE(cs."totalSurcharges", 0)   AS "totalSurcharges",
                  COALESCE(cb."totalBales", 0)        AS "totalBales"
           FROM companies c
           LEFT JOIN company_spend cs ON cs."companyId" = c.id
           LEFT JOIN company_bales cb ON cb."companyId" = c.id
           WHERE c."organizationId" = $1
           ORDER BY ${orderCol} DESC
           LIMIT $${params.length}`,
          params
        );
        await context.report_progress(1, 1);
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }
```

Replace `get_item_profitability` (currently lines 864–959):

```js
      // ── get_item_profitability ────────────────────────────────────────────
      case "get_item_profitability": {
        const organizationId = requireOrgId(args);
        await context.info(`Calculating item profitability (${args.period || "all time"})…`);
        await context.report_progress(0, 1);
        const limit = args.limit || 10;
        const period = args.period || "all";
        const fromDate = getDateFilter(period);

        const params = [organizationId];
        const dateParamIdx = fromDate ? (params.push(fromDate), params.length) : null;
        const saleDateCond = dateParamIdx ? `AND s."soldDate" >= $${dateParamIdx}` : "";
        const purchaseDateCond = dateParamIdx ? `AND p."purchaseDate" >= $${dateParamIdx}` : "";
        params.push(limit);

        const { rows } = await queryTenant(
          organizationId,
          `WITH item_sales AS (
             SELECT
               item->>'itemName'                                           AS "displayItemName",
               LOWER(item->>'itemName')                                    AS "itemKey",
               SUM((item->>'noOfBales')::numeric)                         AS "balesSold",
               COUNT(DISTINCT s.id)                                        AS "totalOrders",
               SUM(
                 COALESCE(NULLIF(item->>'ratePerBale','')::numeric, 0)
                 * (item->>'noOfBales')::numeric
               )                                                           AS "itemRevenue",
               MAX(s."soldDate")                                           AS "lastSaleDate"
             FROM sales s
             CROSS JOIN jsonb_array_elements(s."soldProducts") AS item
             WHERE s."organizationId" = $1 AND s.status = 'APPROVED' ${saleDateCond}
             GROUP BY item->>'itemName', LOWER(item->>'itemName')
           ),
           supplier_bales AS (
             SELECT
               LOWER(item->>'itemName')                                    AS "itemKey",
               c."companyName",
               SUM((item->>'noOfBales')::numeric)                         AS "bales"
             FROM purchases p
             CROSS JOIN jsonb_array_elements(p."purchasedProducts") AS item
             JOIN companies c ON p."companyId" = c.id AND c."organizationId" = $1
             WHERE p."organizationId" = $1 AND p.status = 'APPROVED' ${purchaseDateCond}
             GROUP BY LOWER(item->>'itemName'), c."companyName"
           ),
           primary_suppliers AS (
             SELECT DISTINCT ON ("itemKey") "itemKey", "companyName" AS "primarySupplier"
             FROM supplier_bales
             ORDER BY "itemKey", "bales" DESC
           ),
           item_purchases AS (
             SELECT
               LOWER(item->>'itemName')                                    AS "itemKey",
               SUM(NULLIF(NULLIF(item->>'ratePerBale','')::numeric,0) * (item->>'noOfBales')::numeric)
                 / NULLIF(SUM((item->>'noOfBales')::numeric), 0)          AS "avgPurchaseRatePerBale",
               SUM((item->>'noOfBales')::numeric)                         AS "totalBalesPurchased"
             FROM purchases p
             CROSS JOIN jsonb_array_elements(p."purchasedProducts") AS item
             WHERE p."organizationId" = $1
               AND p.status = 'APPROVED'
               AND (item->>'ratePerBale') IS NOT NULL
               AND (item->>'ratePerBale') <> ''
               AND (item->>'ratePerBale')::numeric > 0
               ${purchaseDateCond}
             GROUP BY LOWER(item->>'itemName')
           )
           SELECT
             s."displayItemName"                                           AS "itemName",
             s."balesSold",
             s."totalOrders",
             ROUND(s."itemRevenue", 0)                                     AS "salesRevenue",
             ip."totalBalesPurchased",
             ps."primarySupplier",
             ROUND(COALESCE(ip."avgPurchaseRatePerBale", 0), 0)           AS "avgPurchaseCostPerBale",
             ROUND(s."balesSold" * COALESCE(ip."avgPurchaseRatePerBale", 0), 0) AS "estimatedCOGS",
             ROUND(s."itemRevenue" - s."balesSold" * COALESCE(ip."avgPurchaseRatePerBale", 0), 0) AS "grossProfit",
             CASE
               WHEN s."itemRevenue" > 0
               THEN ROUND(
                 ((s."itemRevenue" - s."balesSold" * COALESCE(ip."avgPurchaseRatePerBale", 0))
                  / s."itemRevenue") * 100, 1)
               ELSE 0
             END                                                           AS "marginPct",
             s."lastSaleDate"
           FROM item_sales s
           LEFT JOIN item_purchases ip ON s."itemKey" = ip."itemKey"
           LEFT JOIN primary_suppliers ps ON s."itemKey" = ps."itemKey"
           WHERE s."balesSold" > 0
             AND ip."avgPurchaseRatePerBale" IS NOT NULL
             AND ip."avgPurchaseRatePerBale" > 0
             AND LOWER(s."displayItemName") NOT IN ('adjustment', 'adjustments')
           ORDER BY s."itemRevenue" DESC
           LIMIT $${params.length}`,
          params
        );
        await context.report_progress(1, 1);
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }
```

Replace `get_company_purchase_detail` (currently lines 962–1036):

```js
      // ── get_company_purchase_detail ───────────────────────────────────────
      case "get_company_purchase_detail": {
        const organizationId = requireOrgId(args);
        if (!args.company_id && !args.company_name) {
          return {
            content: [{ type: "text", text: "Provide company_id or company_name" }],
            isError: true,
          };
        }

        await context.info(`Fetching purchase details for ${args.company_name || `company #${args.company_id}`}…`);
        await context.report_progress(0, 2);

        const limit = args.limit || 20;
        const params = [organizationId];
        const conditions = [`p."organizationId" = $1`];
        let idx = 2;

        if (args.company_id) {
          conditions.push(`p."companyId" = $${idx++}`);
          params.push(args.company_id);
        } else {
          conditions.push(`${normCol('c."companyName"')} LIKE $${idx++}`);
          params.push(`%${normalizeSearch(args.company_name)}%`);
        }
        if (args.date_from) {
          conditions.push(`p."purchaseDate" >= $${idx++}`);
          params.push(args.date_from);
        }
        if (args.date_to) {
          conditions.push(`p."purchaseDate" <= $${idx++}`);
          params.push(args.date_to);
        }
        if (args.status) {
          conditions.push(`p.status = $${idx++}`);
          params.push(args.status.toUpperCase());
        }

        params.push(limit);

        const { rows: purchases } = await queryTenant(
          organizationId,
          `SELECT p.id, p."totalAmount", p."surCharge", p."invoiceNumber",
                  p.status, p."baleType", p."purchaseDate", p."purchasedProducts",
                  c."companyName" AS "companyName"
           FROM purchases p
           LEFT JOIN companies c ON p."companyId" = c.id AND c."organizationId" = $1
           WHERE ${conditions.join(" AND ")}
           ORDER BY p."purchaseDate" DESC
           LIMIT $${idx}`,
          params
        );

        await context.report_progress(1, 2);
        // conditions[0]=organizationId, conditions[1]=company filter — the pair that
        // identifies "this company in this tenant", reused for the summary aggregate.
        const { rows: summary } = await queryTenant(
          organizationId,
          `SELECT c."companyName" AS "companyName",
                  COUNT(p.id) AS "totalPurchases",
                  COALESCE(SUM(p."totalAmount"), 0) AS "totalSpend",
                  COALESCE(MIN(p."purchaseDate"), NULL) AS "firstPurchaseDate",
                  COALESCE(MAX(p."purchaseDate"), NULL) AS "lastPurchaseDate"
           FROM purchases p
           LEFT JOIN companies c ON p."companyId" = c.id AND c."organizationId" = $1
           WHERE ${conditions.slice(0, 2).join(" AND ")} AND p.status = 'APPROVED'
           GROUP BY c."companyName"`,
          params.slice(0, 2)
        );

        await context.report_progress(2, 2);
        return {
          content: [{ type: "text", text: JSON.stringify({ summary: summary[0] || {}, purchases }, null, 2) }],
        };
      }
```

Replace `get_companies` (currently lines 1039–1061):

```js
      // ── get_companies ─────────────────────────────────────────────────────
      case "get_companies": {
        const organizationId = requireOrgId(args);
        await context.info(args.search ? `Searching companies: "${args.search}"…` : "Loading company list…");
        await context.report_progress(0, 1);
        const limit = args.limit || 20;
        const params = [organizationId];
        let searchClause = "";

        if (args.search) {
          params.push(`%${normalizeSearch(args.search)}%`);
          searchClause = ` AND ${normCol('c."companyName"')} LIKE $2`;
        }
        params.push(limit);

        const { rows } = await queryTenant(
          organizationId,
          `SELECT c.id, c."companyName", c.email, c.phone, c.address
           FROM companies c
           WHERE c."organizationId" = $1${searchClause}
           ORDER BY c."companyName"
           LIMIT $${params.length}`,
          params
        );
        await context.report_progress(1, 1);
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }
```

- [ ] **Step 2: Add the isolation test to `scripts/verify-mcp-tenant-scoping.js`**

Insert before `const VERIFICATIONS = [...]`:

```js
async function verifyPurchaseToolsScoped({ orgA, orgB, mcpClient }) {
  const historyB = await callTool(mcpClient, "get_purchase_history", { organizationId: orgB.id, limit: 50 });
  assertTrue(
    !historyB.data.some((r) => (r.purchasedProducts || []).some((p) => p.itemName === orgA.itemName)),
    "orgB's get_purchase_history must NOT include a purchase of orgA's item"
  );

  const companiesA = await callTool(mcpClient, "get_companies", { organizationId: orgA.id, limit: 100 });
  const namesA = companiesA.data.map((c) => c.companyName);
  assertTrue(namesA.includes(orgA.companyName), "orgA should see its own supplier company");
  assertTrue(!namesA.includes(orgB.companyName), "orgA must NOT see orgB's supplier company");

  const topCompaniesB = await callTool(mcpClient, "get_top_purchasing_companies", {
    organizationId: orgB.id,
    limit: 50,
  });
  assertTrue(
    !topCompaniesB.data.some((c) => c.companyName === orgA.companyName),
    "orgB's get_top_purchasing_companies must NOT rank orgA's company"
  );

  const profitabilityB = await callTool(mcpClient, "get_item_profitability", { organizationId: orgB.id, limit: 50 });
  assertTrue(
    !profitabilityB.data.some((r) => r.itemName === orgA.itemName),
    "orgB's get_item_profitability must NOT include orgA's item"
  );

  const detailA = await callTool(mcpClient, "get_company_purchase_detail", {
    organizationId: orgA.id,
    company_name: orgB.companyName,
  });
  assertTrue(
    (detailA.data.purchases || []).length === 0,
    "orgA must NOT be able to fetch orgB's company purchase detail even by exact name"
  );
}
```

Update `VERIFICATIONS`:

```js
const VERIFICATIONS = [
  verifyGuardRejectsMissingOrgId,
  verifyInventoryToolsScoped,
  verifySalesToolsScoped,
  verifyPurchaseToolsScoped,
];
```

- [ ] **Step 3: Run it to verify every group passes**

Run: `node scripts/verify-mcp-tenant-scoping.js`
Expected: all four verifications print `✓`; `All MCP tenant-scoping checks passed.`; exit code 0.

- [ ] **Step 4: Commit**

```bash
git add mcp-server/index.js scripts/verify-mcp-tenant-scoping.js
git commit -m "feat: scope purchase, company, and profitability MCP tools by organizationId"
```

---

### Task 5: Inject the trusted organizationId in `lib/claude-service.js`

**Files:**

- Modify: `lib/claude-service.js`
- Create: `__tests__/lib/claude-service.test.js`

**Interfaces:**

- Consumes: `TenantContext.assertGet()` from `lib/tenant-context.js` (already exists, see `middlewares/auth.js` for how it's populated).
- Produces: `chat()` now throws `TenantContext not set...` if called outside `TenantContext.run(...)`, and every tool call it makes carries a trusted `organizationId` that overwrites anything the model set.

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/claude-service.test.js`:

```js
import TenantContext from "@/lib/tenant-context";
import { getClaudeService } from "@/lib/claude-service";

function stubMessagesClient(responses) {
  let call = 0;
  return {
    messages: {
      stream: () => ({
        on: () => {},
        finalMessage: async () => responses[call++],
      }),
    },
  };
}

describe("ClaudeService tenant scoping", () => {
  it("throws if chat() is called with no tenant context set", async () => {
    const claudeService = getClaudeService();
    claudeService.initialized = true;

    await expect(claudeService.chat([{ role: "user", content: "hi" }])).rejects.toThrow("TenantContext not set");
  });

  it("injects the trusted organizationId into every tool call and overwrites any value the model set", async () => {
    const claudeService = getClaudeService();
    claudeService.initialized = true;
    claudeService.tools = [
      { name: "get_low_stock", description: "", input_schema: { type: "object", properties: {} } },
    ];

    const capturedInputs = [];
    claudeService.callToolWithTimeout = jest.fn(async (toolName, toolInput) => {
      capturedInputs.push(toolInput);
      return { content: [{ type: "text", text: "[]" }] };
    });

    claudeService.client = stubMessagesClient([
      {
        stop_reason: "tool_use",
        content: [
          {
            type: "tool_use",
            id: "t1",
            name: "get_low_stock",
            // The model tries to smuggle a different org's id — this must never win.
            input: { threshold: 10, organizationId: 999 },
          },
        ],
      },
      {
        stop_reason: "end_turn",
        content: [{ type: "text", text: "done" }],
      },
    ]);

    await TenantContext.run(42, () => claudeService.chat([{ role: "user", content: "low stock?" }]));

    expect(capturedInputs).toHaveLength(1);
    expect(capturedInputs[0]).toEqual({ threshold: 10, organizationId: 42 });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test -- --testPathPattern="claude-service"`
Expected: FAIL — first test fails because `chat()` doesn't currently call `TenantContext.assertGet()` (no error thrown); second test fails because `capturedInputs[0]` is `{ threshold: 10, organizationId: 999 }` (the model's spoofed value), not `{ threshold: 10, organizationId: 42 }`.

- [ ] **Step 3: Implement the fix in `lib/claude-service.js`**

Add the import (after the existing imports, line 5):

```js
import TenantContext from "@/lib/tenant-context";
```

In `chat()` (currently starting at line 106), capture the tenant right after `initialize()`:

```js
  async chat(messages, onProgress = null, onToken = null) {
    await this.initialize();

    // Trusted tenant id for this request — read once, injected into every tool
    // call below, and always overwrites anything the model tries to set itself.
    const organizationId = TenantContext.assertGet();

    // Expose onProgress so the MCP notification handler (context.info) can reach it
    this._progressCallback = onProgress;
```

In the tool-call loop, change the `callToolWithTimeout` invocation (currently around line 183):

```js
          try {
            const toolInput = { ...toolUse.input, organizationId };
            const result = await this.callToolWithTimeout(toolUse.name, toolInput, 20000, onprogress);
            resultText = result.content?.[0]?.text ?? "No result returned";
          } catch (err) {
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test -- --testPathPattern="claude-service"`
Expected: PASS — both tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/claude-service.js __tests__/lib/claude-service.test.js
git commit -m "feat: inject trusted organizationId into every MCP tool call, never trust the model's value"
```

---

### Task 6: Full-tool sweep, package.json wiring, and docs

**Files:**

- Modify: `scripts/verify-mcp-tenant-scoping.js`
- Modify: `package.json`
- Modify: `CLAUDE.md`

**Interfaces:**

- Consumes: everything from Tasks 1–4.
- Produces: `pnpm run db:verify-mcp-tenant` as a CI/pre-launch gate.

- [ ] **Step 1: Add the full-tool guard sweep to `scripts/verify-mcp-tenant-scoping.js`**

Insert before `const VERIFICATIONS = [...]`:

```js
// Every tool must reject a missing organizationId, regardless of what other
// arguments it requires — requireOrgId() must run before any other validation.
async function verifyEveryToolRejectsMissingOrgId({ mcpClient }) {
  const { tools } = await mcpClient.listTools();
  assertTrue(tools.length >= 15, `expected at least 15 tools, found ${tools.length}`);
  for (const tool of tools) {
    const result = await callTool(mcpClient, tool.name, {});
    assertTrue(result.isError, `${tool.name} without organizationId should return isError`);
    assertTrue(
      /organizationId/i.test(result.text),
      `${tool.name} error should mention organizationId, got: ${result.text}`
    );
  }
}
```

Update `VERIFICATIONS` to run the sweep last:

```js
const VERIFICATIONS = [
  verifyGuardRejectsMissingOrgId,
  verifyInventoryToolsScoped,
  verifySalesToolsScoped,
  verifyPurchaseToolsScoped,
  verifyEveryToolRejectsMissingOrgId,
];
```

- [ ] **Step 2: Add the package.json script**

In `package.json`, in the `"scripts"` object, add a line alongside the existing `db:verify-*` entries (after `"db:verify-rls": "node scripts/verify-rls.js",`):

```json
    "db:verify-mcp-tenant": "node scripts/verify-mcp-tenant-scoping.js",
```

- [ ] **Step 3: Run the full script one more time as the final gate**

Run: `pnpm run db:verify-mcp-tenant`
Expected: all five verifications print `✓` (`verifyGuardRejectsMissingOrgId`, `verifyInventoryToolsScoped`, `verifySalesToolsScoped`, `verifyPurchaseToolsScoped`, `verifyEveryToolRejectsMissingOrgId`); `All MCP tenant-scoping checks passed.`; exit code 0.

- [ ] **Step 4: Update `CLAUDE.md`**

In the `### Layer 3: verification scripts` section of `CLAUDE.md`, add a line after the existing `pnpm run db:verify-security` bullet:

```markdown
- `pnpm run db:verify-mcp-tenant` (`scripts/verify-mcp-tenant-scoping.js`) — the AI chatbot's MCP server (`mcp-server/index.js`) is a separate Node subprocess with its own raw `pg` connection, outside `TENANT_MODELS`/RLS transactions; this script seeds two throwaway orgs and drives the real MCP server over stdio to confirm every tool is scoped by `organizationId` and rejects calls missing it
```

- [ ] **Step 5: Run the full test suite to confirm no regressions**

Run: `pnpm test`
Expected: all existing tests pass, plus the two new tests in `__tests__/lib/claude-service.test.js`.

- [ ] **Step 6: Commit**

```bash
git add scripts/verify-mcp-tenant-scoping.js package.json CLAUDE.md
git commit -m "chore: wire MCP tenant-scoping verification into package.json and docs"
```

---

## Post-implementation

Once all six tasks land, update the project memory note at `mcp_chatbot_tenant_isolation_gap.md` to record that the gap is fixed (date + branch), so future sessions don't keep re-flagging it. Also run `pnpm run db:verify-mcp-tenant` once against a Supabase-shaped local setup (RLS enforced, matching `docker-compose`'s demoted role) before this branch merges, since that's the only environment where the `queryTenant` transaction wrapper's `SET LOCAL app.tenant_id` layer actually gets exercised — the explicit `WHERE organizationId = $1` filters are the layer that protects production today, per `CLAUDE.md`'s note that the Supabase role still bypasses RLS.
