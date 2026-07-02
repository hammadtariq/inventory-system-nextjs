// pages/api/sales/returns/index.js builds its default export via
// nextConnect({ onError }).use(auth).post(createSaleReturn).get(getAllSaleReturns) —
// onError/requireRole were previously referenced without being imported from
// @/lib/authz, causing a ReferenceError at module-evaluation time (every request
// to this route crashed with a 500 before even reaching auth/validation).
// createSaleReturn/getAllSaleReturns aren't exported individually, so importing
// the default export here is what actually exercises — and would catch a
// regression of — that line.
jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  SaleReturn: { findAndCountAll: jest.fn() },
  Customer: {},
  Sale: {},
}));

describe("sale returns API module", () => {
  it("builds its default next-connect handler without throwing", () => {
    expect(() => require("@/pages/api/sales/returns/index")).not.toThrow();

    const handler = require("@/pages/api/sales/returns/index").default;
    expect(typeof handler).toBe("function");
  });
});
