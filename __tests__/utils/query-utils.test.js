import { balanceQuery } from "@/utils/query.utils";
import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";
import { companySumQuery, customerSumQuery } from "@/query/index";

jest.mock("@/lib/postgres", () => ({
  __esModule: true,
  default: {
    sequelize: {
      query: jest.fn(),
    },
    Sequelize: {
      QueryTypes: {
        SELECT: "SELECT",
      },
    },
  },
}));

describe("balanceQuery tenant scoping", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.sequelize.query.mockResolvedValue([{ amount: 100 }]);
  });

  it("uses replacements for company balance queries", async () => {
    const result = await TenantContext.run(23, async () => balanceQuery(7, "company"));

    expect(result).toEqual([{ amount: 100 }]);
    expect(db.sequelize.query).toHaveBeenCalledWith(companySumQuery, {
      type: "SELECT",
      replacements: { id: 7, organizationId: 23 },
    });
  });

  it("uses replacements for customer balance queries", async () => {
    await TenantContext.run(45, async () => balanceQuery(9, "customer"));

    expect(db.sequelize.query).toHaveBeenCalledWith(customerSumQuery, {
      type: "SELECT",
      replacements: { id: 9, organizationId: 45 },
    });
  });

  it("requires tenant context", async () => {
    await expect(balanceQuery(7, "company")).rejects.toThrow("TenantContext not set");
  });
});
