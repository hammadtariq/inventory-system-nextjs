#!/usr/bin/env node
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { CallToolRequestSchema, ListToolsRequestSchema } = require("@modelcontextprotocol/sdk/types.js");
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  database: process.env.POSTGRES_DB || "inventory-management-local",
  user: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "postgres",
});

const server = new Server({ name: "inventory-mcp-server", version: "1.0.0" }, { capabilities: { tools: {} } });

const TOOLS = [
  // ── Inventory ──────────────────────────────────────────────────────────────
  {
    name: "list_all_inventory",
    description: "List all inventory items with stock levels and pricing",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max items to return (default 50)" },
        offset: { type: "number", description: "Pagination offset (default 0)" },
      },
    },
  },
  {
    name: "get_inventory_item",
    description:
      "Get a specific inventory item by ID or name. Returns stock levels and pricing only — does not return sales or purchase history.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "number", description: "Item ID" },
        itemName: { type: "string", description: "Item name (partial match)" },
      },
    },
  },
  {
    name: "get_low_stock",
    description: "Get inventory items with stock below a threshold",
    inputSchema: {
      type: "object",
      properties: {
        threshold: { type: "number", description: "Stock threshold (default 10)" },
      },
    },
  },
  {
    name: "search_inventory",
    description: "Search inventory items by name",
    inputSchema: {
      type: "object",
      required: ["query"],
      properties: {
        query: { type: "string", description: "Search term" },
      },
    },
  },
  // ── Sales ───────────────────────────────────────────────────────────────────
  {
    name: "get_sales_history",
    description: "Get sales records with optional filters by date, customer, or status",
    inputSchema: {
      type: "object",
      properties: {
        date_from: { type: "string", description: "Start date (YYYY-MM-DD)" },
        date_to: { type: "string", description: "End date (YYYY-MM-DD)" },
        customer_id: { type: "number", description: "Filter by customer ID" },
        status: {
          type: "string",
          description: "Filter by status: PENDING, APPROVED, CANCEL",
        },
        limit: { type: "number", description: "Max records to return (default 20)" },
      },
    },
  },
  {
    name: "get_sales_summary",
    description: "Get total revenue, sales count, and top selling items for a period",
    inputSchema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          description: "today | week | month | all (default: all)",
        },
      },
    },
  },
  {
    name: "get_revenue_report",
    description: "Daily revenue breakdown with totals for a period",
    inputSchema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          description: "today | week | month | all (default: month)",
        },
      },
    },
  },
  {
    name: "get_item_sales_performance",
    description:
      "For a specific inventory item, get bales sold, revenue, and last sale date. Does NOT return supplier or purchase cost — use get_item_profitability for margin analysis.",
    inputSchema: {
      type: "object",
      required: ["item_name"],
      properties: {
        item_name: { type: "string", description: "Inventory item name (partial match)" },
      },
    },
  },
  {
    name: "get_customers",
    description: "List all customers or search by name",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Search by first or last name" },
        limit: { type: "number", description: "Max records (default 20)" },
      },
    },
  },
  {
    name: "get_top_customers_by_sales",
    description:
      "Rank customers by total revenue, sales count, or total bales sold. Answers 'which customer has the highest sales / spends the most?'",
    inputSchema: {
      type: "object",
      properties: {
        rank_by: {
          type: "string",
          description: "totalRevenue | totalSales | totalBales (default: totalRevenue)",
        },
        period: {
          type: "string",
          description: "today | week | month | all (default: all)",
        },
        limit: { type: "number", description: "Number of customers to return (default 10)" },
      },
    },
  },
  // ── Purchases ───────────────────────────────────────────────────────────────
  {
    name: "get_purchase_history",
    description: "Get purchase records with optional filters by date, company, or status",
    inputSchema: {
      type: "object",
      properties: {
        date_from: { type: "string", description: "Start date (YYYY-MM-DD)" },
        date_to: { type: "string", description: "End date (YYYY-MM-DD)" },
        company_id: { type: "number", description: "Filter by company ID" },
        status: {
          type: "string",
          description: "Filter by status: PENDING, APPROVED, CANCEL",
        },
        limit: { type: "number", description: "Max records to return (default 20)" },
      },
    },
  },
  {
    name: "get_purchase_summary",
    description: "Get total spend, purchase count, and top purchased items for a period",
    inputSchema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          description: "today | week | month | all (default: all)",
        },
      },
    },
  },
  {
    name: "get_purchase_spend_report",
    description: "Daily spend breakdown with totals for a period",
    inputSchema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          description: "today | week | month | all (default: month)",
        },
      },
    },
  },
  {
    name: "get_item_purchase_performance",
    description:
      "For a specific inventory item, get total bales purchased, total spend, and last purchase date. Does NOT return margin or sales data — use get_item_profitability for margin analysis.",
    inputSchema: {
      type: "object",
      required: ["item_name"],
      properties: {
        item_name: { type: "string", description: "Inventory item name (partial match)" },
      },
    },
  },
  {
    name: "get_companies",
    description: "List all supplier companies or search by name",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Search by company name" },
        limit: { type: "number", description: "Max records (default 20)" },
      },
    },
  },
  {
    name: "get_top_purchasing_companies",
    description:
      "Rank supplier companies by total spend, purchase count, or total bales purchased. Answers questions like 'which company buys the most?'",
    inputSchema: {
      type: "object",
      properties: {
        rank_by: {
          type: "string",
          description: "totalSpend | totalPurchases | totalBales (default: totalSpend)",
        },
        period: {
          type: "string",
          description: "today | week | month | all (default: all)",
        },
        limit: { type: "number", description: "Number of companies to return (default 10)" },
      },
    },
  },
  {
    name: "get_item_profitability",
    description:
      "Calculate per-item profit margin. Returns: itemName, primarySupplier (top supplier by bales), balesSold, salesRevenue, avgPurchaseCostPerBale, estimatedCOGS, grossProfit, marginPct. Use this for any margin/profitability question. Do NOT call any other tool to look up supplier or revenue — this tool already returns those fields.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of items to return (default 10)" },
        period: {
          type: "string",
          description: "Filter sales/purchases by period: today | week | month | all (default: all)",
        },
      },
    },
  },
  {
    name: "get_company_purchase_detail",
    description: "Get all purchase records for a specific company, searchable by company name or ID",
    inputSchema: {
      type: "object",
      properties: {
        company_id: { type: "number", description: "Company ID" },
        company_name: { type: "string", description: "Company name (partial match)" },
        date_from: { type: "string", description: "Start date (YYYY-MM-DD)" },
        date_to: { type: "string", description: "End date (YYYY-MM-DD)" },
        status: {
          type: "string",
          description: "Filter by status: PENDING, APPROVED, CANCEL",
        },
        limit: { type: "number", description: "Max records (default 20)" },
      },
    },
  },
];

// Normalize search: trim, lowercase, collapse spaces, remove spaces inside brackets
// e.g. "Adjustment ( Hamza)" → "adjustment (hamza)"
function normalizeSearch(term) {
  return term
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s*([()[\]])\s*/g, "$1");
}

// Same normalization applied to a DB column expression
function normCol(col) {
  return `regexp_replace(regexp_replace(LOWER(${col}), '\\s+', ' ', 'g'), '\\s*([()\\[\\]])\\s*', '\\1', 'g')`;
}

function getDateFilter(period) {
  const now = new Date();
  switch (period) {
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "week": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d;
    }
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    default:
      return null;
  }
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
  const { name, arguments: args = {} } = request.params;

  // MCP context helpers — mirrors context.info() and context.report_progress()
  const context = {
    info: async (message) => {
      try {
        await extra.sendNotification({
          method: "notifications/message",
          params: { level: "info", logger: "inventory-mcp", data: message },
        });
      } catch (_) {}
    },
    report_progress: async (progress, total) => {
      const token = extra._meta?.progressToken;
      if (token === undefined) return;
      try {
        await extra.sendNotification({
          method: "notifications/progress",
          params: { progressToken: token, progress, total },
        });
      } catch (_) {}
    },
  };

  try {
    switch (name) {
      // ── list_all_inventory ────────────────────────────────────────────────
      case "list_all_inventory": {
        await context.info("Querying all inventory items…");
        await context.report_progress(0, 1);
        const limit = args.limit || 50;
        const offset = args.offset || 0;
        const { rows } = await pool.query(
          `SELECT i.id, i."itemName", i."noOfBales" AS "totalBalesPurchased", i."onHand" AS "currentStockOnHand",
                  i."baleWeightLbs", i."baleWeightKgs",
                  i."ratePerLbs", i."ratePerKgs", i."ratePerBale",
                  c."companyName" AS "companyName"
           FROM inventories i
           LEFT JOIN companies c ON i."companyId" = c.id
           ORDER BY i."itemName"
           LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
        await context.report_progress(1, 1);
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }

      // ── get_inventory_item ────────────────────────────────────────────────
      case "get_inventory_item": {
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
             LEFT JOIN companies c ON i."companyId" = c.id WHERE i.id = $1`
          : `SELECT i.id, i."itemName", i."noOfBales" AS "totalBalesPurchased", i."onHand" AS "currentStockOnHand",
                    i."baleWeightLbs", i."baleWeightKgs", i."ratePerLbs", i."ratePerKgs", i."ratePerBale",
                    c."companyName" AS "companyName"
             FROM inventories i
             LEFT JOIN companies c ON i."companyId" = c.id
             WHERE ${normCol('i."itemName"')} LIKE $1`;
        const param = args.id ? args.id : `%${normalizeSearch(args.itemName)}%`;
        const { rows } = await pool.query(query, [param]);
        await context.report_progress(1, 1);
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }

      // ── get_low_stock ─────────────────────────────────────────────────────
      case "get_low_stock": {
        await context.info(`Checking low-stock items (threshold: ${args.threshold || 10})…`);
        await context.report_progress(0, 1);
        const threshold = args.threshold || 10;
        const { rows } = await pool.query(
          `SELECT i.id, i."itemName", i."onHand" AS "currentStockOnHand", i."noOfBales" AS "totalBalesPurchased",
                  c."companyName" AS "companyName"
           FROM inventories i
           LEFT JOIN companies c ON i."companyId" = c.id
           WHERE i."onHand" < $1
           ORDER BY i."onHand" ASC`,
          [threshold]
        );
        await context.report_progress(1, 1);
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }

      // ── search_inventory ──────────────────────────────────────────────────
      case "search_inventory": {
        await context.info(`Searching inventory for "${args.query}"…`);
        await context.report_progress(0, 1);
        const { rows } = await pool.query(
          `SELECT i.id, i."itemName", i."onHand" AS "currentStockOnHand", i."ratePerLbs",
                  i."ratePerKgs", i."ratePerBale",
                  c."companyName" AS "companyName"
           FROM inventories i
           LEFT JOIN companies c ON i."companyId" = c.id
           WHERE ${normCol('i."itemName"')} LIKE $1
           ORDER BY i."itemName"`,
          [`%${normalizeSearch(args.query)}%`]
        );
        await context.report_progress(1, 1);
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }

      // ── get_sales_history ─────────────────────────────────────────────────
      case "get_sales_history": {
        await context.info("Loading sales history…");
        await context.report_progress(0, 1);
        const limit = args.limit || 20;
        const conditions = [];
        const params = [];
        let idx = 1;

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

        const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
        params.push(limit);

        const { rows } = await pool.query(
          `SELECT s.id, s."totalAmount", s."laborCharge", s.status,
                  s."soldDate", s."soldProducts",
                  c."firstName" || ' ' || c."lastName" AS "customerName"
           FROM sales s
           LEFT JOIN customers c ON s."customerId" = c.id
           ${where}
           ORDER BY s."soldDate" DESC
           LIMIT $${idx}`,
          params
        );
        await context.report_progress(1, 1);
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }

      // ── get_sales_summary ─────────────────────────────────────────────────
      case "get_sales_summary": {
        await context.info(`Loading sales summary (${args.period || "all time"})…`);
        await context.report_progress(0, 2);
        const period = args.period || "all";
        const fromDate = getDateFilter(period);
        const params = [];
        const dateWhere = fromDate
          ? (params.push(fromDate), `WHERE s."soldDate" >= $1 AND s.status = 'APPROVED'`)
          : `WHERE s.status = 'APPROVED'`;

        const { rows: totals } = await pool.query(
          `SELECT COUNT(*) AS "totalSales",
                  COALESCE(SUM(s."totalAmount"), 0) AS "totalRevenue",
                  COALESCE(SUM(s."laborCharge"), 0) AS "totalLaborCharges"
           FROM sales s ${dateWhere}`,
          params
        );

        await context.report_progress(1, 2);
        const { rows: topItems } = await pool.query(
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
            {
              type: "text",
              text: JSON.stringify({ period, ...totals[0], topSellingItems: topItems }, null, 2),
            },
          ],
        };
      }

      // ── get_revenue_report ────────────────────────────────────────────────
      case "get_revenue_report": {
        await context.info(`Building revenue report (${args.period || "month"})…`);
        await context.report_progress(0, 2);
        const period = args.period || "month";
        const fromDate = getDateFilter(period);
        const params = [];
        const dateWhere = fromDate
          ? (params.push(fromDate), `WHERE s."soldDate" >= $1 AND s.status = 'APPROVED'`)
          : `WHERE s.status = 'APPROVED'`;

        const { rows: daily } = await pool.query(
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
        const { rows: summary } = await pool.query(
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
            {
              type: "text",
              text: JSON.stringify({ period, summary: summary[0], dailyBreakdown: daily }, null, 2),
            },
          ],
        };
      }

      // ── get_item_sales_performance ────────────────────────────────────────
      case "get_item_sales_performance": {
        await context.info(`Fetching sales performance for "${args.item_name}"…`);
        await context.report_progress(0, 1);
        const { rows } = await pool.query(
          `SELECT
            item->>'itemName' AS "itemName",
            SUM((item->>'noOfBales')::numeric) AS "totalBalesSold",
            COUNT(DISTINCT s.id) AS "totalOrders",
            SUM(s."totalAmount") AS "revenueGenerated",
            MAX(s."soldDate") AS "lastSaleDate"
           FROM sales s, jsonb_array_elements(s."soldProducts") AS item
           WHERE ${normCol("item->>'itemName'")} LIKE $1
             AND s.status = 'APPROVED'
           GROUP BY item->>'itemName'`,
          [`%${normalizeSearch(args.item_name)}%`]
        );
        await context.report_progress(1, 1);
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }

      // ── get_customers ─────────────────────────────────────────────────────
      case "get_customers": {
        await context.info(args.search ? `Searching customers: "${args.search}"…` : "Loading customer list…");
        await context.report_progress(0, 1);
        const limit = args.limit || 20;
        const params = [];
        let where = "";

        if (args.search) {
          where = `WHERE ${normCol('c."firstName"')} LIKE $1 OR ${normCol('c."lastName"')} LIKE $1`;
          params.push(`%${normalizeSearch(args.search)}%`);
        }
        params.push(limit);

        const { rows } = await pool.query(
          `SELECT c.id, c."firstName", c."lastName", c.email, c.phone, c.address
           FROM customers c ${where}
           ORDER BY c."firstName"
           LIMIT $${params.length}`,
          params
        );
        await context.report_progress(1, 1);
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }

      // ── get_top_customers_by_sales ────────────────────────────────────────
      case "get_top_customers_by_sales": {
        await context.info(`Ranking customers by ${args.rank_by || "revenue"}…`);
        await context.report_progress(0, 1);
        const limit = args.limit || 10;
        const period = args.period || "all";
        const rankBy = args.rank_by || "totalRevenue";
        const fromDate = getDateFilter(period);

        const params = [];
        const dateCondition = fromDate ? (params.push(fromDate), `AND s."soldDate" >= $${params.length}`) : "";

        const orderCol =
          rankBy === "totalSales" ? '"totalSales"' : rankBy === "totalBales" ? '"totalBalesSold"' : '"totalRevenue"';

        params.push(limit);

        const { rows } = await pool.query(
          `SELECT cu.id AS "customerId",
                  cu."firstName" || ' ' || cu."lastName" AS "customerName",
                  COUNT(DISTINCT s.id) AS "totalSales",
                  COALESCE(SUM(s."totalAmount"), 0) AS "totalRevenue",
                  COALESCE(SUM(s."laborCharge"), 0) AS "totalLaborCharges",
                  COALESCE(SUM((item.val->>'noOfBales')::numeric), 0) AS "totalBalesSold",
                  MAX(s."soldDate") AS "lastSaleDate"
           FROM customers cu
           LEFT JOIN sales s ON s."customerId" = cu.id AND s.status = 'APPROVED' ${dateCondition}
           LEFT JOIN LATERAL jsonb_array_elements(
             COALESCE(s."soldProducts", '[]'::jsonb)
           ) AS item(val) ON true
           GROUP BY cu.id, cu."firstName", cu."lastName"
           ORDER BY ${orderCol} DESC
           LIMIT $${params.length}`,
          params
        );
        await context.report_progress(1, 1);
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }

      // ── get_purchase_history ──────────────────────────────────────────────
      case "get_purchase_history": {
        await context.info("Loading purchase history…");
        await context.report_progress(0, 1);
        const limit = args.limit || 20;
        const conditions = [];
        const params = [];
        let idx = 1;

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

        const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
        params.push(limit);

        const { rows } = await pool.query(
          `SELECT p.id, p."totalAmount", p."surCharge", p."invoiceNumber",
                  p.status, p."baleType", p."purchaseDate", p."purchasedProducts",
                  c."companyName" AS "companyName"
           FROM purchases p
           LEFT JOIN companies c ON p."companyId" = c.id
           ${where}
           ORDER BY p."purchaseDate" DESC
           LIMIT $${idx}`,
          params
        );
        await context.report_progress(1, 1);
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }

      // ── get_purchase_summary ──────────────────────────────────────────────
      case "get_purchase_summary": {
        await context.info(`Loading purchase summary (${args.period || "all time"})…`);
        await context.report_progress(0, 2);
        const period = args.period || "all";
        const fromDate = getDateFilter(period);
        const params = [];
        const dateWhere = fromDate
          ? (params.push(fromDate), `WHERE p."purchaseDate" >= $1 AND p.status = 'APPROVED'`)
          : `WHERE p.status = 'APPROVED'`;

        const { rows: totals } = await pool.query(
          `SELECT COUNT(*) AS "totalPurchases",
                  COALESCE(SUM(p."totalAmount"), 0) AS "totalSpend",
                  COALESCE(SUM(p."surCharge"), 0) AS "totalSurcharges"
           FROM purchases p ${dateWhere}`,
          params
        );

        await context.report_progress(1, 2);
        const { rows: topItems } = await pool.query(
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
            {
              type: "text",
              text: JSON.stringify({ period, ...totals[0], topPurchasedItems: topItems }, null, 2),
            },
          ],
        };
      }

      // ── get_purchase_spend_report ─────────────────────────────────────────
      case "get_purchase_spend_report": {
        await context.info(`Building purchase spend report (${args.period || "month"})…`);
        await context.report_progress(0, 2);
        const period = args.period || "month";
        const fromDate = getDateFilter(period);
        const params = [];
        const dateWhere = fromDate
          ? (params.push(fromDate), `WHERE p."purchaseDate" >= $1 AND p.status = 'APPROVED'`)
          : `WHERE p.status = 'APPROVED'`;

        const { rows: daily } = await pool.query(
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
        const { rows: summary } = await pool.query(
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
            {
              type: "text",
              text: JSON.stringify({ period, summary: summary[0], dailyBreakdown: daily }, null, 2),
            },
          ],
        };
      }

      // ── get_item_purchase_performance ─────────────────────────────────────
      case "get_item_purchase_performance": {
        await context.info(`Fetching purchase performance for "${args.item_name}"…`);
        await context.report_progress(0, 1);
        const { rows } = await pool.query(
          `SELECT
            item->>'itemName' AS "itemName",
            SUM((item->>'noOfBales')::numeric) AS "totalBalesPurchased",
            COUNT(DISTINCT p.id) AS "totalOrders",
            SUM(p."totalAmount") AS "totalSpend",
            MAX(p."purchaseDate") AS "lastPurchaseDate"
           FROM purchases p, jsonb_array_elements(p."purchasedProducts") AS item
           WHERE ${normCol("item->>'itemName'")} LIKE $1
             AND p.status = 'APPROVED'
           GROUP BY item->>'itemName'`,
          [`%${normalizeSearch(args.item_name)}%`]
        );
        await context.report_progress(1, 1);
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }

      // ── get_top_purchasing_companies ──────────────────────────────────────
      case "get_top_purchasing_companies": {
        await context.info(`Ranking companies by ${args.rank_by || "spend"}…`);
        await context.report_progress(0, 1);
        const limit = args.limit || 10;
        const period = args.period || "all";
        const rankBy = args.rank_by || "totalSpend";
        const fromDate = getDateFilter(period);

        const params = [];
        const dateCondition = fromDate ? (params.push(fromDate), `AND p."purchaseDate" >= $${params.length}`) : "";

        const orderCol =
          rankBy === "totalPurchases" ? '"totalPurchases"' : rankBy === "totalBales" ? '"totalBales"' : '"totalSpend"';

        params.push(limit);

        const { rows } = await pool.query(
          `SELECT c.id AS "companyId",
                  c."companyName" AS "companyName",
                  COUNT(DISTINCT p.id) AS "totalPurchases",
                  COALESCE(SUM(p."totalAmount"), 0) AS "totalSpend",
                  COALESCE(SUM(p."surCharge"), 0) AS "totalSurcharges",
                  COALESCE(SUM((item.val->>'noOfBales')::numeric), 0) AS "totalBales"
           FROM companies c
           LEFT JOIN purchases p
             ON p."companyId" = c.id AND p.status = 'APPROVED' ${dateCondition}
           LEFT JOIN LATERAL jsonb_array_elements(
             COALESCE(p."purchasedProducts", '[]'::jsonb)
           ) AS item(val) ON true
           GROUP BY c.id, c."companyName"
           ORDER BY ${orderCol} DESC
           LIMIT $${params.length}`,
          params
        );
        await context.report_progress(1, 1);
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }

      // ── get_item_profitability ────────────────────────────────────────────
      case "get_item_profitability": {
        await context.info(`Calculating item profitability (${args.period || "all time"})…`);
        await context.report_progress(0, 1);
        const limit = args.limit || 10;
        const period = args.period || "all";
        const fromDate = getDateFilter(period);

        const params = [];
        const saleDateCond = fromDate ? (params.push(fromDate), `AND s."soldDate" >= $${params.length}`) : "";
        const purchaseDateCond = fromDate ? `AND p."purchaseDate" >= $1` : "";

        // COGS = bales_sold × avg_purchase_rate_per_bale (from purchase line items)
        // Sales revenue = sum of (ratePerBale × noOfBales) per sold item
        params.push(limit);

        const { rows } = await pool.query(
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
             WHERE s.status = 'APPROVED' ${saleDateCond}
             GROUP BY item->>'itemName', LOWER(item->>'itemName')
           ),
           supplier_bales AS (
             SELECT
               LOWER(item->>'itemName')                                    AS "itemKey",
               c."companyName",
               SUM((item->>'noOfBales')::numeric)                         AS "bales"
             FROM purchases p
             CROSS JOIN jsonb_array_elements(p."purchasedProducts") AS item
             JOIN companies c ON p."companyId" = c.id
             WHERE p.status = 'APPROVED' ${purchaseDateCond}
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
               -- Weighted average: total spend ÷ total bales (more accurate than simple AVG)
               SUM(NULLIF(NULLIF(item->>'ratePerBale','')::numeric,0) * (item->>'noOfBales')::numeric)
                 / NULLIF(SUM((item->>'noOfBales')::numeric), 0)          AS "avgPurchaseRatePerBale",
               SUM((item->>'noOfBales')::numeric)                         AS "totalBalesPurchased"
             FROM purchases p
             CROSS JOIN jsonb_array_elements(p."purchasedProducts") AS item
             WHERE p.status = 'APPROVED'
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

      // ── get_company_purchase_detail ───────────────────────────────────────
      case "get_company_purchase_detail": {
        if (!args.company_id && !args.company_name) {
          return {
            content: [{ type: "text", text: "Provide company_id or company_name" }],
            isError: true,
          };
        }

        await context.info(`Fetching purchase details for ${args.company_name || `company #${args.company_id}`}…`);
        await context.report_progress(0, 2);

        const limit = args.limit || 20;
        const conditions = [];
        const params = [];
        let idx = 1;

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

        const { rows: purchases } = await pool.query(
          `SELECT p.id, p."totalAmount", p."surCharge", p."invoiceNumber",
                  p.status, p."baleType", p."purchaseDate", p."purchasedProducts",
                  c."companyName" AS "companyName"
           FROM purchases p
           LEFT JOIN companies c ON p."companyId" = c.id
           WHERE ${conditions.join(" AND ")}
           ORDER BY p."purchaseDate" DESC
           LIMIT $${idx}`,
          params
        );

        await context.report_progress(1, 2);
        // aggregate summary for this company
        const { rows: summary } = await pool.query(
          `SELECT c."companyName" AS "companyName",
                  COUNT(p.id) AS "totalPurchases",
                  COALESCE(SUM(p."totalAmount"), 0) AS "totalSpend",
                  COALESCE(MIN(p."purchaseDate"), NULL) AS "firstPurchaseDate",
                  COALESCE(MAX(p."purchaseDate"), NULL) AS "lastPurchaseDate"
           FROM purchases p
           LEFT JOIN companies c ON p."companyId" = c.id
           WHERE ${conditions.slice(0, 1).join(" AND ")} AND p.status = 'APPROVED'
           GROUP BY c."companyName"`,
          params.slice(0, 1)
        );

        await context.report_progress(2, 2);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ summary: summary[0] || {}, purchases }, null, 2),
            },
          ],
        };
      }

      // ── get_companies ─────────────────────────────────────────────────────
      case "get_companies": {
        await context.info(args.search ? `Searching companies: "${args.search}"…` : "Loading company list…");
        await context.report_progress(0, 1);
        const limit = args.limit || 20;
        const params = [];
        let where = "";

        if (args.search) {
          where = `WHERE ${normCol('c."companyName"')} LIKE $1`;
          params.push(`%${normalizeSearch(args.search)}%`);
        }
        params.push(limit);

        const { rows } = await pool.query(
          `SELECT c.id, c."companyName", c.email, c.phone, c.address
           FROM companies c ${where}
           ORDER BY c."companyName"
           LIMIT $${params.length}`,
          params
        );
        await context.report_progress(1, 1);
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (err) {
    console.error(`[MCP] Tool "${name}" error:`, err.message);
    return {
      content: [{ type: "text", text: `Database error: ${err.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Inventory MCP Server running on stdio");
}

main().catch((err) => {
  console.error("MCP Server failed:", err);
  process.exit(1);
});
