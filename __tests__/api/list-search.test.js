// The list screens' column search must run on the server, so a match on a later page is
// still found instead of only filtering the rows already loaded on the current page.
import { createMocks } from "node-mocks-http";
import { Op } from "sequelize";

import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";
import { getAllCustomers } from "@/pages/api/customer/index";
import { getAllItems } from "@/pages/api/items/index";
import { getAllSales } from "@/pages/api/sales/index";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  Customer: { findAndCountAll: jest.fn() },
  Sale: { findAndCountAll: jest.fn() },
  Items: { findAndCountAll: jest.fn() },
  Company: {},
}));

const queryWhere = async (handler, model, query) => {
  model.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
  const { req, res } = createMocks({ method: "GET", query: { limit: "50", offset: "0", ...query } });
  await TenantContext.run(9, () => handler(req, res));
  expect(res._getStatusCode()).toBe(200);
  return model.findAndCountAll.mock.calls[0][0].where;
};

beforeEach(() => jest.clearAllMocks());

describe("customer list search", () => {
  it.each(["firstName", "email", "phone"])("searches %s across all customers, ignoring case", async (field) => {
    const where = await queryWhere(getAllCustomers, db.Customer, { search: " Ali ", searchField: field });
    expect(where).toEqual({ organizationId: 9, [field]: { [Op.iLike]: "%Ali%" } });
  });

  it("ignores a search on a column that can't be searched", async () => {
    const where = await queryWhere(getAllCustomers, db.Customer, { search: "x", searchField: "organizationId" });
    expect(where).toEqual({ organizationId: 9 });
  });
});

describe("sales list search", () => {
  it("searches the customer's first name across all sales", async () => {
    const where = await queryWhere(getAllSales, db.Sale, { search: "ali", searchField: "firstName" });
    expect(where).toEqual({ "$customer.firstName$": { [Op.iLike]: "%ali%" } });
  });

  it("matches status text to the statuses that contain it", async () => {
    const where = await queryWhere(getAllSales, db.Sale, { search: "pend", searchField: "status" });
    expect(where).toEqual({ status: { [Op.in]: ["PENDING"] } });
  });
});

describe("items list search", () => {
  it("searches item names across all items, keeping the company filter", async () => {
    const where = await queryWhere(getAllItems, db.Items, {
      search: "cotton",
      searchField: "itemName",
      companyId: "4",
    });
    expect(where).toEqual({ companyId: "4", itemName: { [Op.iLike]: "%cotton%" } });
  });
});
