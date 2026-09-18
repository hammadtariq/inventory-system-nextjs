import { createMocks } from "node-mocks-http";

import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";
import { searchSales } from "@/pages/api/sales/search";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  Sequelize: {
    Op: {
      or: Symbol("or"),
      like: Symbol("like"),
    },
  },
  Customer: {
    findAll: jest.fn(),
  },
}));

describe("customer search API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("scopes customer search to the active organization", async () => {
    db.Customer.findAll.mockResolvedValue([{ id: 1, firstName: "Hammad", organizationId: 9 }]);

    const { req, res } = createMocks({
      method: "GET",
      query: { value: "ham" },
    });

    await TenantContext.run(9, async () => searchSales(req, res));

    expect(db.Customer.findAll).toHaveBeenCalledWith({
      where: {
        organizationId: 9,
        [db.Sequelize.Op.or]: [{ firstName: { [db.Sequelize.Op.like]: "%ham%" } }],
      },
    });
    expect(res._getStatusCode()).toBe(200);
  });
});
