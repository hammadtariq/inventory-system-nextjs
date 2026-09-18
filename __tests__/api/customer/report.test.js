import { createMocks } from "node-mocks-http";

import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";
import { getCustomerReport } from "@/pages/api/customer/report";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  Sequelize: {
    Op: {
      between: Symbol("between"),
    },
  },
  Customer: {
    findAll: jest.fn(),
  },
  Sale: {},
}));

describe("customer report API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("scopes customer reports to the active organization", async () => {
    db.Customer.findAll.mockResolvedValue([
      {
        toJSON: () => ({
          id: 1,
          firstName: "Hammad",
          lastName: "Tariq",
          email: "hammad@example.com",
          phone: "1234567890",
          address: "1234 Main Street",
          Sales: [{ totalAmount: "100.50" }, { totalAmount: "49.50" }],
        }),
      },
    ]);

    const { req, res } = createMocks({
      method: "GET",
      query: {
        dateRangeStart: "2026-04-01",
        dateRangeEnd: "2026-04-30",
        customerId: "1",
      },
    });

    await TenantContext.run(9, async () => getCustomerReport(req, res));

    expect(db.Customer.findAll).toHaveBeenCalledWith({
      where: expect.objectContaining({
        organizationId: 9,
        id: "1",
      }),
      include: [
        expect.objectContaining({
          model: db.Sale,
          required: false,
          attributes: ["id", "totalAmount"],
          where: { organizationId: 9 },
        }),
      ],
      order: [["createdAt", "DESC"]],
    });
    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      rows: [
        {
          id: 1,
          name: "Hammad Tariq",
          email: "hammad@example.com",
          phone: "1234567890",
          address: "1234 Main Street",
          totalInvoices: 2,
          totalAmount: 150,
        },
      ],
      total: {
        grandTotal: 150,
        totalCustomers: 1,
      },
    });
  });
});
