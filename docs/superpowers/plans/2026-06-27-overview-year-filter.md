# Overview Year Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a year-filter dropdown to the Overview page so all dashboard data is scoped to the selected year, defaulting to the current year, with available years populated dynamically from the database.

**Architecture:** A new `/api/overview/available-years` endpoint returns distinct years with data. All 7 existing overview API endpoints are updated to accept a `?year=YYYY` query param (falling back to the current year). The frontend adds a `Select` dropdown that triggers a full re-fetch of all dashboard data when the year changes.

**Tech Stack:** Next.js (Pages Router), Sequelize raw queries, Ant Design (`Select`), `node-mocks-http` for tests, `TenantContext` for org scoping.

---

## File Map

| File                                                   | Action |
| ------------------------------------------------------ | ------ |
| `pages/api/overview/available-years.js`                | Create |
| `__tests__/api/overview/available-years.test.js`       | Create |
| `pages/api/overview/sales-vs-purchases.js`             | Modify |
| `__tests__/api/overview/sales-vs-purchases.test.js`    | Create |
| `pages/api/overview/cards.js`                          | Modify |
| `__tests__/api/overview/cards.test.js`                 | Create |
| `pages/api/overview/sales-distribution.js`             | Modify |
| `__tests__/api/overview/sales-distribution.test.js`    | Create |
| `pages/api/overview/purchase-distribution.js`          | Modify |
| `__tests__/api/overview/purchase-distribution.test.js` | Create |
| `pages/api/overview/company-comparison.js`             | Modify |
| `__tests__/api/overview/company-comparison.test.js`    | Create |
| `pages/api/overview/top-customers.js`                  | Modify |
| `__tests__/api/overview/top-customers.test.js`         | Create |
| `pages/api/overview/top-products.js`                   | Modify |
| `__tests__/api/overview/top-products.test.js`          | Create |
| `hooks/overview.js`                                    | Modify |
| `pages/index.js`                                       | Modify |

---

## Task 1: New `available-years` API endpoint

**Files:**

- Create: `pages/api/overview/available-years.js`
- Create: `__tests__/api/overview/available-years.test.js`

- [ ] **Step 1: Write the failing test**

Create `__tests__/api/overview/available-years.test.js`:

```js
import { createMocks } from "node-mocks-http";
import { getAvailableYears } from "@/pages/api/overview/available-years";
import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  sequelize: {
    query: jest.fn(),
  },
  Sequelize: {
    QueryTypes: { SELECT: "SELECT" },
  },
}));

describe("getAvailableYears", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.dbConnect.mockResolvedValue();
  });

  it("returns sorted years from sales and purchases", async () => {
    db.sequelize.query.mockResolvedValue([{ year: 2026 }, { year: 2025 }, { year: 2024 }]);

    const { req, res } = createMocks({ method: "GET" });

    await TenantContext.run(9, async () => getAvailableYears(req, res));

    expect(db.sequelize.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        replacements: expect.objectContaining({ organizationId: 9 }),
      })
    );
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toEqual([2026, 2025, 2024]);
  });

  it("returns 500 on db error", async () => {
    db.sequelize.query.mockRejectedValue(new Error("db error"));
    const { req, res } = createMocks({ method: "GET" });

    await TenantContext.run(9, async () => getAvailableYears(req, res));

    expect(res._getStatusCode()).toBe(500);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test -- --testPathPattern="available-years"
```

Expected: FAIL — `getAvailableYears` not found.

- [ ] **Step 3: Create `pages/api/overview/available-years.js`**

```js
import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import TenantContext from "@/lib/tenant-context";

export const getAvailableYears = async (req, res) => {
  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();

    const result = await db.sequelize.query(
      `SELECT DISTINCT EXTRACT(YEAR FROM "soldDate")::integer AS year
       FROM sales
       WHERE "organizationId" = :organizationId AND status = 'APPROVED'
       UNION
       SELECT DISTINCT EXTRACT(YEAR FROM "purchaseDate")::integer AS year
       FROM purchases
       WHERE "organizationId" = :organizationId AND status = 'APPROVED'
       ORDER BY year DESC`,
      { type: db.Sequelize.QueryTypes.SELECT, replacements: { organizationId } }
    );

    return res.send(result.map((r) => r.year));
  } catch (error) {
    console.error("Error retrieving available years:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

export default nextConnect().use(auth).get(getAvailableYears);
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test -- --testPathPattern="available-years"
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add pages/api/overview/available-years.js __tests__/api/overview/available-years.test.js
git commit -m "feat: add available-years overview API endpoint"
```

---

## Task 2: Update `sales-vs-purchases` endpoint

**Files:**

- Modify: `pages/api/overview/sales-vs-purchases.js`
- Create: `__tests__/api/overview/sales-vs-purchases.test.js`

- [ ] **Step 1: Write the failing test**

Create `__tests__/api/overview/sales-vs-purchases.test.js`:

```js
import { createMocks } from "node-mocks-http";
import { getSalesVsPurchases } from "@/pages/api/overview/sales-vs-purchases";
import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  sequelize: { query: jest.fn() },
  Sequelize: { QueryTypes: { SELECT: "SELECT" } },
}));

const emptyMonths = Array.from({ length: 12 }, (_, i) => ({ month: "Jan", month_num: i + 1, total: "0" }));

describe("getSalesVsPurchases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.dbConnect.mockResolvedValue();
    db.sequelize.query.mockResolvedValue(emptyMonths);
  });

  it("uses the year from query param", async () => {
    const { req, res } = createMocks({ method: "GET", query: { year: "2025" } });

    await TenantContext.run(9, async () => getSalesVsPurchases(req, res));

    expect(db.sequelize.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ replacements: expect.objectContaining({ year: 2025, organizationId: 9 }) })
    );
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toHaveProperty("salesData");
    expect(res._getData()).toHaveProperty("purchasesData");
  });

  it("falls back to current year when no year param", async () => {
    const { req, res } = createMocks({ method: "GET", query: {} });

    await TenantContext.run(9, async () => getSalesVsPurchases(req, res));

    expect(db.sequelize.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ replacements: expect.objectContaining({ year: new Date().getFullYear() }) })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test -- --testPathPattern="sales-vs-purchases"
```

Expected: FAIL — `getSalesVsPurchases` not a named export.

- [ ] **Step 3: Update `pages/api/overview/sales-vs-purchases.js`**

Replace the entire file:

```js
import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import TenantContext from "@/lib/tenant-context";

export const getSalesVsPurchases = async (req, res) => {
  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const queryOptions = {
      type: db.Sequelize.QueryTypes.SELECT,
      replacements: { organizationId, year },
    };

    const [salesData, purchasesData] = await Promise.all([
      db.sequelize.query(
        `SELECT
          TO_CHAR(TO_DATE(gs::text, 'MM'), 'Mon') as month,
          gs as month_num,
          COALESCE(SUM(s."totalAmount"), 0) as total
         FROM generate_series(1, 12) gs
         LEFT JOIN sales s
           ON EXTRACT(MONTH FROM s."soldDate") = gs
           AND EXTRACT(YEAR FROM s."soldDate") = :year
           AND s.status = 'APPROVED'
           AND s."organizationId" = :organizationId
         GROUP BY gs
         ORDER BY gs`,
        queryOptions
      ),
      db.sequelize.query(
        `SELECT
          TO_CHAR(TO_DATE(gs::text, 'MM'), 'Mon') as month,
          gs as month_num,
          COALESCE(SUM(p."totalAmount"), 0) as total
         FROM generate_series(1, 12) gs
         LEFT JOIN purchases p
           ON EXTRACT(MONTH FROM p."purchaseDate") = gs
           AND EXTRACT(YEAR FROM p."purchaseDate") = :year
           AND p.status = 'APPROVED'
           AND p."organizationId" = :organizationId
         GROUP BY gs
         ORDER BY gs`,
        queryOptions
      ),
    ]);

    return res.send({ salesData, purchasesData });
  } catch (error) {
    console.error("Error retrieving sales vs purchases:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

export default nextConnect().use(auth).get(getSalesVsPurchases);
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test -- --testPathPattern="sales-vs-purchases"
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add pages/api/overview/sales-vs-purchases.js __tests__/api/overview/sales-vs-purchases.test.js
git commit -m "feat: parameterize year in sales-vs-purchases overview API"
```

---

## Task 3: Update `cards` endpoint

**Files:**

- Modify: `pages/api/overview/cards.js`
- Create: `__tests__/api/overview/cards.test.js`

- [ ] **Step 1: Write the failing test**

Create `__tests__/api/overview/cards.test.js`:

```js
import { createMocks } from "node-mocks-http";
import { getCards } from "@/pages/api/overview/cards";
import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  sequelize: { query: jest.fn() },
  Sequelize: { QueryTypes: { SELECT: "SELECT" } },
}));

describe("getCards", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.dbConnect.mockResolvedValue();
    db.sequelize.query
      .mockResolvedValueOnce([{ total: "5000" }]) // totalSales
      .mockResolvedValueOnce([{ total: "3000" }]) // totalPurchases
      .mockResolvedValueOnce([{ total: "200" }]) // customerBalances
      .mockResolvedValueOnce([{ total: "-100" }]); // companyBalances
  });

  it("passes year to all queries", async () => {
    const { req, res } = createMocks({ method: "GET", query: { year: "2024" } });

    await TenantContext.run(9, async () => getCards(req, res));

    expect(db.sequelize.query).toHaveBeenCalledTimes(4);
    db.sequelize.query.mock.calls.forEach(([, opts]) => {
      expect(opts.replacements).toMatchObject({ organizationId: 9, year: 2024 });
    });
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toEqual({
      totalSales: 5000,
      totalPurchases: 3000,
      totalSaleDue: 200,
      totalPurchaseDue: -100,
    });
  });

  it("falls back to current year when no year param", async () => {
    const { req, res } = createMocks({ method: "GET", query: {} });

    await TenantContext.run(9, async () => getCards(req, res));

    db.sequelize.query.mock.calls.forEach(([, opts]) => {
      expect(opts.replacements.year).toBe(new Date().getFullYear());
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test -- --testPathPattern="cards"
```

Expected: FAIL — `getCards` not a named export.

- [ ] **Step 3: Update `pages/api/overview/cards.js`**

Replace the entire file:

```js
import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import TenantContext from "@/lib/tenant-context";

export const getCards = async (req, res) => {
  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const queryOptions = {
      type: db.Sequelize.QueryTypes.SELECT,
      replacements: { organizationId, year },
    };

    const [totalSalesResult, totalPurchasesResult, customerBalances, companyBalances] = await Promise.all([
      db.sequelize.query(
        `SELECT COALESCE(SUM("totalAmount"), 0) as total
         FROM sales
         WHERE status = 'APPROVED'
           AND "organizationId" = :organizationId
           AND EXTRACT(YEAR FROM "soldDate") = :year`,
        queryOptions
      ),
      db.sequelize.query(
        `SELECT COALESCE(SUM("totalAmount"), 0) as total
         FROM purchases
         WHERE status = 'APPROVED'
           AND "organizationId" = :organizationId
           AND EXTRACT(YEAR FROM "purchaseDate") = :year`,
        queryOptions
      ),
      db.sequelize.query(
        `SELECT COALESCE(SUM(t.total), 0) as total FROM (
          SELECT c."id",
            SUM(CASE
              WHEN l."paymentType" = 'REFUND' THEN -l.amount
              WHEN l."paymentType" IN ('CASH', 'ONLINE', 'CHEQUE') THEN l.amount
              WHEN l."paymentType" = 'INVENTORY_RETURN' THEN l.amount
              WHEN l."spendType" = 'DEBIT' THEN l.amount
              WHEN l."spendType" = 'CREDIT' THEN -l.amount
              ELSE 0
            END) AS total
          FROM ledgers l
          INNER JOIN customers c ON l."customerId" = c.id
          WHERE l."organizationId" = :organizationId
            AND c."organizationId" = :organizationId
            AND EXTRACT(YEAR FROM l."createdAt") = :year
          GROUP BY c."id"
        ) t WHERE t.total > 0`,
        queryOptions
      ),
      db.sequelize.query(
        `SELECT COALESCE(SUM(t.total), 0) as total FROM (
          SELECT comp."id",
            SUM(CASE
              WHEN l."paymentType" IN ('CASH', 'ONLINE', 'CHEQUE') THEN -l.amount
              WHEN l."spendType" = 'CREDIT' THEN -l.amount
              WHEN l."spendType" = 'DEBIT' THEN l.amount
              ELSE 0
            END) AS total
          FROM ledgers l
          INNER JOIN companies comp ON l."companyId" = comp.id
          WHERE l."organizationId" = :organizationId
            AND comp."organizationId" = :organizationId
            AND EXTRACT(YEAR FROM l."createdAt") = :year
          GROUP BY comp."id"
        ) t WHERE t.total < 0`,
        queryOptions
      ),
    ]);

    return res.send({
      totalSales: parseFloat(totalSalesResult[0].total) || 0,
      totalPurchases: parseFloat(totalPurchasesResult[0].total) || 0,
      totalSaleDue: parseFloat(customerBalances[0].total) || 0,
      totalPurchaseDue: parseFloat(companyBalances[0].total) || 0,
    });
  } catch (error) {
    console.error("Error retrieving dashboard cards:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

export default nextConnect().use(auth).get(getCards);
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test -- --testPathPattern="cards"
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add pages/api/overview/cards.js __tests__/api/overview/cards.test.js
git commit -m "feat: add year filter to overview cards API"
```

---

## Task 4: Update `sales-distribution` endpoint

**Files:**

- Modify: `pages/api/overview/sales-distribution.js`
- Create: `__tests__/api/overview/sales-distribution.test.js`

- [ ] **Step 1: Write the failing test**

Create `__tests__/api/overview/sales-distribution.test.js`:

```js
import { createMocks } from "node-mocks-http";
import { getSalesDistribution } from "@/pages/api/overview/sales-distribution";
import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  sequelize: { query: jest.fn() },
  Sequelize: { QueryTypes: { SELECT: "SELECT" } },
}));

describe("getSalesDistribution", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.dbConnect.mockResolvedValue();
    db.sequelize.query
      .mockResolvedValueOnce([{ total: "8000" }]) // paid
      .mockResolvedValueOnce([{ total: "2000" }]) // due
      .mockResolvedValueOnce([{ total: "500" }]); // return
  });

  it("passes year to all three queries", async () => {
    const { req, res } = createMocks({ method: "GET", query: { year: "2023" } });

    await TenantContext.run(9, async () => getSalesDistribution(req, res));

    expect(db.sequelize.query).toHaveBeenCalledTimes(3);
    db.sequelize.query.mock.calls.forEach(([, opts]) => {
      expect(opts.replacements).toMatchObject({ organizationId: 9, year: 2023 });
    });
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toEqual({ paid: 8000, due: 2000, return: 500 });
  });

  it("falls back to current year when no year param", async () => {
    const { req, res } = createMocks({ method: "GET", query: {} });

    await TenantContext.run(9, async () => getSalesDistribution(req, res));

    db.sequelize.query.mock.calls.forEach(([, opts]) => {
      expect(opts.replacements.year).toBe(new Date().getFullYear());
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test -- --testPathPattern="sales-distribution"
```

Expected: FAIL — `getSalesDistribution` not a named export.

- [ ] **Step 3: Update `pages/api/overview/sales-distribution.js`**

Replace the entire file:

```js
import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import TenantContext from "@/lib/tenant-context";

export const getSalesDistribution = async (req, res) => {
  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const queryOptions = {
      type: db.Sequelize.QueryTypes.SELECT,
      replacements: { organizationId, year },
    };

    const [paidResult, dueResult, returnResult] = await Promise.all([
      db.sequelize.query(
        `SELECT COALESCE(SUM(amount), 0) as total
         FROM ledgers
         WHERE "customerId" IS NOT NULL
           AND "organizationId" = :organizationId
           AND "paymentType" IN ('CASH', 'ONLINE', 'CHEQUE')
           AND EXTRACT(YEAR FROM "createdAt") = :year`,
        queryOptions
      ),
      db.sequelize.query(
        `SELECT COALESCE(SUM(t.total), 0) as total FROM (
          SELECT c."id",
            SUM(CASE
              WHEN l."paymentType" = 'REFUND' THEN -l.amount
              WHEN l."paymentType" IN ('CASH', 'ONLINE', 'CHEQUE') THEN l.amount
              WHEN l."paymentType" = 'INVENTORY_RETURN' THEN l.amount
              WHEN l."spendType" = 'DEBIT' THEN l.amount
              WHEN l."spendType" = 'CREDIT' THEN -l.amount
              ELSE 0
            END) AS total
          FROM ledgers l
          INNER JOIN customers c ON l."customerId" = c.id
          WHERE l."organizationId" = :organizationId
            AND c."organizationId" = :organizationId
            AND EXTRACT(YEAR FROM l."createdAt") = :year
          GROUP BY c."id"
        ) t WHERE t.total > 0`,
        queryOptions
      ),
      db.sequelize.query(
        `SELECT COALESCE(SUM("totalAmount"), 0) as total
         FROM "saleReturns"
         WHERE "organizationId" = :organizationId
           AND EXTRACT(YEAR FROM "createdAt") = :year`,
        queryOptions
      ),
    ]);

    return res.send({
      paid: parseFloat(paidResult[0].total) || 0,
      due: parseFloat(dueResult[0].total) || 0,
      return: parseFloat(returnResult[0].total) || 0,
    });
  } catch (error) {
    console.error("Error retrieving sales distribution:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

export default nextConnect().use(auth).get(getSalesDistribution);
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test -- --testPathPattern="sales-distribution"
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add pages/api/overview/sales-distribution.js __tests__/api/overview/sales-distribution.test.js
git commit -m "feat: add year filter to sales-distribution overview API"
```

---

## Task 5: Update `purchase-distribution` endpoint

**Files:**

- Modify: `pages/api/overview/purchase-distribution.js`
- Create: `__tests__/api/overview/purchase-distribution.test.js`

- [ ] **Step 1: Write the failing test**

Create `__tests__/api/overview/purchase-distribution.test.js`:

```js
import { createMocks } from "node-mocks-http";
import { getPurchaseDistribution } from "@/pages/api/overview/purchase-distribution";
import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  sequelize: { query: jest.fn() },
  Sequelize: { QueryTypes: { SELECT: "SELECT" } },
}));

describe("getPurchaseDistribution", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.dbConnect.mockResolvedValue();
    db.sequelize.query
      .mockResolvedValueOnce([{ total: "4000" }]) // paid
      .mockResolvedValueOnce([{ total: "6000" }]); // total purchases
  });

  it("passes year to both queries and computes remaining correctly", async () => {
    const { req, res } = createMocks({ method: "GET", query: { year: "2025" } });

    await TenantContext.run(9, async () => getPurchaseDistribution(req, res));

    expect(db.sequelize.query).toHaveBeenCalledTimes(2);
    db.sequelize.query.mock.calls.forEach(([, opts]) => {
      expect(opts.replacements).toMatchObject({ organizationId: 9, year: 2025 });
    });
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toEqual({ paid: 4000, remaining: 2000, total: 6000 });
  });

  it("falls back to current year when no year param", async () => {
    const { req, res } = createMocks({ method: "GET", query: {} });

    await TenantContext.run(9, async () => getPurchaseDistribution(req, res));

    db.sequelize.query.mock.calls.forEach(([, opts]) => {
      expect(opts.replacements.year).toBe(new Date().getFullYear());
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test -- --testPathPattern="purchase-distribution"
```

Expected: FAIL — `getPurchaseDistribution` not a named export.

- [ ] **Step 3: Update `pages/api/overview/purchase-distribution.js`**

Replace the entire file:

```js
import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import TenantContext from "@/lib/tenant-context";

export const getPurchaseDistribution = async (req, res) => {
  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const queryOptions = {
      type: db.Sequelize.QueryTypes.SELECT,
      replacements: { organizationId, year },
    };

    const [paidResult, totalResult] = await Promise.all([
      db.sequelize.query(
        `SELECT COALESCE(SUM(amount), 0) as total
         FROM ledgers
         WHERE "companyId" IS NOT NULL
           AND "organizationId" = :organizationId
           AND "paymentType" IN ('CASH', 'ONLINE', 'CHEQUE')
           AND EXTRACT(YEAR FROM "createdAt") = :year`,
        queryOptions
      ),
      db.sequelize.query(
        `SELECT COALESCE(SUM("totalAmount"), 0) as total
         FROM purchases
         WHERE status = 'APPROVED'
           AND "organizationId" = :organizationId
           AND EXTRACT(YEAR FROM "purchaseDate") = :year`,
        queryOptions
      ),
    ]);

    const paid = parseFloat(paidResult[0].total) || 0;
    const total = parseFloat(totalResult[0].total) || 0;
    const remaining = Math.max(total - paid, 0);

    return res.send({ paid, remaining, total });
  } catch (error) {
    console.error("Error retrieving purchase distribution:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

export default nextConnect().use(auth).get(getPurchaseDistribution);
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test -- --testPathPattern="purchase-distribution"
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add pages/api/overview/purchase-distribution.js __tests__/api/overview/purchase-distribution.test.js
git commit -m "feat: add year filter to purchase-distribution overview API"
```

---

## Task 6: Update `company-comparison` endpoint

**Files:**

- Modify: `pages/api/overview/company-comparison.js`
- Create: `__tests__/api/overview/company-comparison.test.js`

- [ ] **Step 1: Write the failing test**

Create `__tests__/api/overview/company-comparison.test.js`:

```js
import { createMocks } from "node-mocks-http";
import { getCompanyComparison } from "@/pages/api/overview/company-comparison";
import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  sequelize: { query: jest.fn() },
  Sequelize: { QueryTypes: { SELECT: "SELECT" } },
}));

describe("getCompanyComparison", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.dbConnect.mockResolvedValue();
    db.sequelize.query.mockResolvedValue([
      { name: "Acme Co", total: "15000" },
      { name: "Beta Ltd", total: "8000" },
    ]);
  });

  it("passes year to query and returns results", async () => {
    const { req, res } = createMocks({ method: "GET", query: { year: "2026" } });

    await TenantContext.run(9, async () => getCompanyComparison(req, res));

    expect(db.sequelize.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ replacements: expect.objectContaining({ organizationId: 9, year: 2026 }) })
    );
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toHaveLength(2);
  });

  it("falls back to current year when no year param", async () => {
    const { req, res } = createMocks({ method: "GET", query: {} });

    await TenantContext.run(9, async () => getCompanyComparison(req, res));

    expect(db.sequelize.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ replacements: expect.objectContaining({ year: new Date().getFullYear() }) })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test -- --testPathPattern="company-comparison"
```

Expected: FAIL — `getCompanyComparison` not a named export.

- [ ] **Step 3: Update `pages/api/overview/company-comparison.js`**

Replace the entire file:

```js
import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import TenantContext from "@/lib/tenant-context";

export const getCompanyComparison = async (req, res) => {
  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const result = await db.sequelize.query(
      `SELECT
        comp."companyName" as name,
        COALESCE(SUM(p."totalAmount"), 0) as total
       FROM companies comp
       LEFT JOIN purchases p
         ON p."companyId" = comp.id
         AND p.status = 'APPROVED'
         AND p."organizationId" = :organizationId
         AND EXTRACT(YEAR FROM p."purchaseDate") = :year
       WHERE comp."organizationId" = :organizationId
       GROUP BY comp.id, comp."companyName"
       ORDER BY total DESC
       LIMIT 5`,
      { type: db.Sequelize.QueryTypes.SELECT, replacements: { organizationId, year } }
    );

    return res.send(result);
  } catch (error) {
    console.error("Error retrieving company comparison:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

export default nextConnect().use(auth).get(getCompanyComparison);
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test -- --testPathPattern="company-comparison"
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add pages/api/overview/company-comparison.js __tests__/api/overview/company-comparison.test.js
git commit -m "feat: add year filter to company-comparison overview API"
```

---

## Task 7: Update `top-customers` endpoint

**Files:**

- Modify: `pages/api/overview/top-customers.js`
- Create: `__tests__/api/overview/top-customers.test.js`

- [ ] **Step 1: Write the failing test**

Create `__tests__/api/overview/top-customers.test.js`:

```js
import { createMocks } from "node-mocks-http";
import { getTopCustomers } from "@/pages/api/overview/top-customers";
import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  sequelize: { query: jest.fn() },
  Sequelize: { QueryTypes: { SELECT: "SELECT" } },
}));

describe("getTopCustomers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.dbConnect.mockResolvedValue();
    db.sequelize.query.mockResolvedValue([{ name: "Alice Smith", id: 1, total: "50000", salesTransactions: 5 }]);
  });

  it("passes year to query and returns results", async () => {
    const { req, res } = createMocks({ method: "GET", query: { year: "2025" } });

    await TenantContext.run(9, async () => getTopCustomers(req, res));

    expect(db.sequelize.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ replacements: expect.objectContaining({ organizationId: 9, year: 2025 }) })
    );
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toHaveLength(1);
  });

  it("falls back to current year when no year param", async () => {
    const { req, res } = createMocks({ method: "GET", query: {} });

    await TenantContext.run(9, async () => getTopCustomers(req, res));

    expect(db.sequelize.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ replacements: expect.objectContaining({ year: new Date().getFullYear() }) })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test -- --testPathPattern="top-customers"
```

Expected: FAIL — `getTopCustomers` not a named export.

- [ ] **Step 3: Update `pages/api/overview/top-customers.js`**

Replace the entire file:

```js
import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import TenantContext from "@/lib/tenant-context";

export const getTopCustomers = async (req, res) => {
  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const result = await db.sequelize.query(
      `SELECT CONCAT(c."firstName", ' ', c."lastName") as name,
        c."id" as "id",
        SUM(s."totalAmount") as total,
        COUNT(s.id)::integer as "salesTransactions"
      FROM sales s
      INNER JOIN customers c ON s."customerId" = c.id
      WHERE s.status = 'APPROVED'
        AND s."organizationId" = :organizationId
        AND c."organizationId" = :organizationId
        AND EXTRACT(YEAR FROM s."soldDate") = :year
      GROUP BY c.id
      ORDER BY total DESC
      LIMIT 5`,
      { type: db.Sequelize.QueryTypes.SELECT, replacements: { organizationId, year } }
    );

    return res.send(result);
  } catch (error) {
    console.error("Error retrieving top customers:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

export default nextConnect().use(auth).get(getTopCustomers);
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test -- --testPathPattern="top-customers"
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add pages/api/overview/top-customers.js __tests__/api/overview/top-customers.test.js
git commit -m "feat: add year filter to top-customers overview API"
```

---

## Task 8: Update `top-products` endpoint

**Files:**

- Modify: `pages/api/overview/top-products.js`
- Create: `__tests__/api/overview/top-products.test.js`

- [ ] **Step 1: Write the failing test**

Create `__tests__/api/overview/top-products.test.js`:

```js
import { createMocks } from "node-mocks-http";
import { getTopProducts } from "@/pages/api/overview/top-products";
import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  sequelize: { query: jest.fn() },
  Sequelize: { QueryTypes: { SELECT: "SELECT" } },
}));

describe("getTopProducts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.dbConnect.mockResolvedValue();
    db.sequelize.query.mockResolvedValue([
      { name: "Jacket", totalBales: "200" },
      { name: "Shirt", totalBales: "150" },
    ]);
  });

  it("passes year to query and returns results", async () => {
    const { req, res } = createMocks({ method: "GET", query: { year: "2026" } });

    await TenantContext.run(9, async () => getTopProducts(req, res));

    expect(db.sequelize.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ replacements: expect.objectContaining({ organizationId: 9, year: 2026 }) })
    );
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toHaveLength(2);
  });

  it("falls back to current year when no year param", async () => {
    const { req, res } = createMocks({ method: "GET", query: {} });

    await TenantContext.run(9, async () => getTopProducts(req, res));

    expect(db.sequelize.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ replacements: expect.objectContaining({ year: new Date().getFullYear() }) })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test -- --testPathPattern="top-products"
```

Expected: FAIL — `getTopProducts` not a named export.

- [ ] **Step 3: Update `pages/api/overview/top-products.js`**

Replace the entire file:

```js
import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import TenantContext from "@/lib/tenant-context";

export const getTopProducts = async (req, res) => {
  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const result = await db.sequelize.query(
      `SELECT
        product->>'itemName' as name,
        SUM((product->>'noOfBales')::numeric) as "totalBales"
       FROM sales,
         jsonb_array_elements("soldProducts") as product
       WHERE status = 'APPROVED'
         AND "organizationId" = :organizationId
         AND EXTRACT(YEAR FROM "soldDate") = :year
       GROUP BY product->>'itemName'
       ORDER BY "totalBales" DESC
       LIMIT 5`,
      { type: db.Sequelize.QueryTypes.SELECT, replacements: { organizationId, year } }
    );

    return res.send(result);
  } catch (error) {
    console.error("Error retrieving top products:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

export default nextConnect().use(auth).get(getTopProducts);
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test -- --testPathPattern="top-products"
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add pages/api/overview/top-products.js __tests__/api/overview/top-products.test.js
git commit -m "feat: add year filter to top-products overview API"
```

---

## Task 9: Update `hooks/overview.js`

**Files:**

- Modify: `hooks/overview.js`

- [ ] **Step 1: Replace `hooks/overview.js`**

```js
import { get } from "@/lib/http-client";

// Legacy — kept for backwards compatibility
export const graphTablesCount = () => get(`/api/overview/count`);
export const graphPurchaseTable = () => get(`/api/overview/purchase`);
export const graphSaleTable = () => get(`/api/overview/sales`);

// Dashboard
export const getAvailableYears = () => get(`/api/overview/available-years`);
export const getDashboardCards = (year) => get(`/api/overview/cards?year=${year}`);
export const getSalesVsPurchases = (year) => get(`/api/overview/sales-vs-purchases?year=${year}`);
export const getSalesDistribution = (year) => get(`/api/overview/sales-distribution?year=${year}`);
export const getPurchaseDistribution = (year) => get(`/api/overview/purchase-distribution?year=${year}`);
export const getTopProducts = (year) => get(`/api/overview/top-products?year=${year}`);
export const getTopCustomers = (year) => get(`/api/overview/top-customers?year=${year}`);
export const getCompanyComparison = (year) => get(`/api/overview/company-comparison?year=${year}`);
```

- [ ] **Step 2: Run all overview-related tests to verify nothing broke**

```bash
pnpm test -- --testPathPattern="overview"
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add hooks/overview.js
git commit -m "feat: add year param to all overview hooks"
```

---

## Task 10: Update `pages/index.js` frontend

**Files:**

- Modify: `pages/index.js`

- [ ] **Step 1: Replace `pages/index.js`**

```js
import { Card, Col, Row, List, Spin, Select } from "antd";
import { ShoppingCartOutlined, CreditCardOutlined, ShopOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { Line, Pie, Column } from "@ant-design/charts";
import { useEffect, useState } from "react";
import {
  getAvailableYears,
  getDashboardCards,
  getSalesVsPurchases,
  getSalesDistribution,
  getPurchaseDistribution,
  getTopProducts,
  getTopCustomers,
  getCompanyComparison,
} from "@/hooks/overview";
import styles from "@/styles/Dashboard.module.css";

const formatCurrency = (num) => {
  const value = num || 0;
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}₨${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}₨${(abs / 1_000).toFixed(1)}K`;
  return `${sign}₨${abs.toLocaleString()}`;
};

const STAT_CARDS = [
  {
    key: "totalSales",
    title: "TOTAL SALES",
    subtitle: "Overall Sales",
    icon: <ShoppingCartOutlined />,
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    key: "totalSaleDue",
    title: "TOTAL SALE DUE",
    subtitle: "Pending Payments",
    icon: <CreditCardOutlined />,
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  },
  {
    key: "totalPurchases",
    title: "TOTAL PURCHASES",
    subtitle: "Total Spending",
    icon: <ShopOutlined />,
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  },
  {
    key: "totalPurchaseDue",
    title: "TOTAL PURCHASE DUE",
    subtitle: "Outstanding Payables",
    icon: <ExclamationCircleOutlined />,
    gradient: "linear-gradient(135deg, #f7971e 0%, #ffd200 100%)",
  },
];

export default function Home() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [availableYears, setAvailableYears] = useState([currentYear]);
  const [cards, setCards] = useState(null);
  const [chartsData, setChartsData] = useState(null);
  const [listsData, setListsData] = useState(null);
  const [loadingCards, setLoadingCards] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [loadingLists, setLoadingLists] = useState(true);

  // Fetch available years once on mount
  useEffect(() => {
    getAvailableYears().then((years) => {
      if (years && years.length > 0) {
        setAvailableYears(years.includes(currentYear) ? years : [currentYear, ...years]);
      }
    });
  }, []);

  // Fetch all dashboard data when year changes
  useEffect(() => {
    setLoadingCards(true);
    setLoadingCharts(true);
    setLoadingLists(true);

    getDashboardCards(year)
      .then(setCards)
      .finally(() => setLoadingCards(false));

    Promise.all([
      getSalesVsPurchases(year),
      getSalesDistribution(year),
      getPurchaseDistribution(year),
      getCompanyComparison(year),
    ])
      .then(([salesVsPurchases, salesDist, purchaseDist, companies]) => {
        setChartsData({ salesVsPurchases, salesDist, purchaseDist, companies });
      })
      .finally(() => setLoadingCharts(false));

    Promise.all([getTopProducts(year), getTopCustomers(year)])
      .then(([products, customers]) => setListsData({ products, customers }))
      .finally(() => setLoadingLists(false));
  }, [year]);

  // Transform to flat array for multi-line chart
  const lineChartData = chartsData
    ? [
        ...chartsData.salesVsPurchases.purchasesData.map((d) => ({
          month: d.month,
          value: parseFloat(d.total),
          type: "Purchase",
        })),
        ...chartsData.salesVsPurchases.salesData.map((d) => ({
          month: d.month,
          value: parseFloat(d.total),
          type: "Sales",
        })),
      ]
    : [];

  const salesDonutData = chartsData
    ? [
        { type: "Paid", value: chartsData.salesDist.paid },
        { type: "Due", value: chartsData.salesDist.due },
        ...(chartsData.salesDist.return > 0 ? [{ type: "Return", value: chartsData.salesDist.return }] : []),
      ].filter((d) => d.value > 0)
    : [];

  const companiesData = (chartsData?.companies || []).map((c) => ({
    ...c,
    total: parseFloat(c.total) || 0,
    label: c.name.length > 13 ? c.name.slice(0, 12) + "…" : c.name,
  }));

  const purchasePieData = chartsData
    ? [
        { type: "Paid", value: chartsData.purchaseDist.paid },
        ...(chartsData.purchaseDist.remaining > 0
          ? [{ type: "Remaining", value: chartsData.purchaseDist.remaining }]
          : []),
      ].filter((d) => d.value > 0)
    : [];

  const cardTitle = (title, subtitle) => (
    <div>
      <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
      <div style={{ fontSize: 12, color: "#8c8c8c", fontWeight: 400 }}>{subtitle}</div>
    </div>
  );

  return (
    <div className={styles.dashboard}>
      {/* Year filter */}
      <Row justify="end" style={{ marginBottom: 16 }}>
        <Col>
          <Select
            value={year}
            onChange={setYear}
            style={{ width: 120 }}
            options={availableYears.map((y) => ({ label: String(y), value: y }))}
          />
        </Col>
      </Row>

      {/* Row 1 — Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {STAT_CARDS.map((card) => (
          <Col xs={24} sm={12} lg={6} key={card.key}>
            <Card
              bordered={false}
              style={{ background: card.gradient, borderRadius: 12 }}
              styles={{ body: { padding: "20px 24px" } }}
            >
              <Spin spinning={loadingCards}>
                <div className={styles.statCard}>
                  <div className={styles.statCardIcon}>{card.icon}</div>
                  <div>
                    <div className={styles.statCardTitle}>{card.title}</div>
                    <div className={styles.statCardValue}>{formatCurrency(cards?.[card.key])}</div>
                    <div className={styles.statCardSubtitle}>{card.subtitle}</div>
                  </div>
                </div>
              </Spin>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Row 2 — Line chart + Sales donut */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card
            bordered={false}
            title={cardTitle("Sales vs Purchases (Monthly)", "Monthly sales vs purchase performance")}
          >
            <Spin spinning={loadingCharts}>
              <Line
                data={lineChartData}
                xField="month"
                yField="value"
                colorField="type"
                height={260}
                style={({ type }) => ({
                  lineWidth: 2,
                  lineDash: type === "Purchase" ? [4, 4] : undefined,
                })}
                axis={{
                  y: {
                    labelFormatter: (val) => {
                      if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)}M`;
                      if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
                      return val;
                    },
                  },
                }}
                tooltip={{
                  items: [
                    {
                      channel: "y",
                      valueFormatter: (val) => formatCurrency(val),
                    },
                  ],
                }}
                legend={{ position: "bottom" }}
              />
            </Spin>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card bordered={false} title={cardTitle("Sales (Paid/Due/Return)", "Sales Overview Paid, Due, and Returned")}>
            <Spin spinning={loadingCharts}>
              <Pie
                data={salesDonutData.length ? salesDonutData : [{ type: "No Data", value: 1 }]}
                angleField="value"
                colorField="type"
                innerRadius={0.6}
                height={260}
                scale={{ color: { range: ["#7c3aed", "#4f46e5", "#a78bfa"] } }}
                tooltip={{
                  items: [
                    {
                      channel: "y",
                      valueFormatter: (val) => formatCurrency(val),
                    },
                  ],
                }}
                legend={{ position: "bottom" }}
              />
            </Spin>
          </Card>
        </Col>
      </Row>

      {/* Row 3 — Purchase donut + Company comparison */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={10}>
          <Card
            bordered={false}
            title={cardTitle("Purchase Distribution", "Purchase Overview Paid, Due, and Returned")}
          >
            <Spin spinning={loadingCharts}>
              <Pie
                data={purchasePieData.length ? purchasePieData : [{ type: "No Data", value: 1 }]}
                angleField="value"
                colorField="type"
                innerRadius={0.6}
                height={260}
                scale={{ color: { range: ["#059669", "#d1fae5"] } }}
                tooltip={{
                  items: [
                    {
                      channel: "y",
                      valueFormatter: (val) => formatCurrency(val),
                    },
                  ],
                }}
                legend={{ position: "bottom" }}
              />
            </Spin>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card bordered={false} title={cardTitle("Company Comparison", "Revenue and orders by company")}>
            <Spin spinning={loadingCharts}>
              <Column
                data={companiesData}
                xField="label"
                yField="total"
                height={260}
                style={{ fill: "#7c3aed", radius: 4 }}
                axis={{
                  y: {
                    labelFormatter: (val) => {
                      if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)}M`;
                      if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
                      return val;
                    },
                  },
                }}
                tooltip={{
                  items: [
                    {
                      channel: "y",
                      valueFormatter: (val) => formatCurrency(val),
                    },
                  ],
                }}
              />
            </Spin>
          </Card>
        </Col>
      </Row>

      {/* Row 4 — Top Products + Top Customers */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            title={
              <span>
                <span style={{ marginRight: 6 }}>Top</span>Selling Products
              </span>
            }
          >
            <Spin spinning={loadingLists}>
              <List
                dataSource={listsData?.products || []}
                locale={{ emptyText: "No data" }}
                renderItem={(item, index) => (
                  <List.Item extra={<span className={styles.rankBadge}>#{index + 1}</span>}>
                    <List.Item.Meta
                      title={item.name}
                      description={`${parseFloat(item.totalBales).toLocaleString()} Bales Sold`}
                    />
                  </List.Item>
                )}
              />
            </Spin>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            title={
              <span>
                <span style={{ marginRight: 6 }}>Top</span>Customers
              </span>
            }
          >
            <Spin spinning={loadingLists}>
              <List
                dataSource={listsData?.customers || []}
                locale={{ emptyText: "No data" }}
                renderItem={(item, index) => (
                  <List.Item extra={<span className={styles.rankBadge}>#{index + 1}</span>}>
                    <List.Item.Meta title={item.name} description={`${formatCurrency(item.total)} Total Revenue`} />
                  </List.Item>
                )}
              />
            </Spin>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
```

- [ ] **Step 2: Run all overview tests**

```bash
pnpm test -- --testPathPattern="overview"
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add hooks/overview.js pages/index.js
git commit -m "feat: add year filter dropdown to Overview page"
```

---

## Final verification

- [ ] **Run the full test suite**

```bash
pnpm test
```

Expected: All tests pass, no regressions.
