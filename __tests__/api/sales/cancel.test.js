import { createMocks } from "node-mocks-http";

import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";
import { cancelSaleOrder } from "@/pages/api/sales/cancel/[id]";
import { STATUS } from "@/utils/api.util";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  Sale: {
    findOne: jest.fn(),
  },
}));

describe("cancelSaleOrder", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects approved sale cancellation because stock reversal is not implemented", async () => {
    const sale = {
      status: STATUS.APPROVED,
      update: jest.fn(),
    };
    db.Sale.findOne.mockResolvedValue(sale);

    const { req, res } = createMocks({
      method: "PUT",
      query: { id: 1 },
    });
    req.user = { role: "ADMIN" };

    await TenantContext.run(23, async () => cancelSaleOrder(req, res));

    expect(res._getStatusCode()).toBe(400);
    expect(res._getData()).toEqual({ message: "Approved sale orders cannot be cancelled without reversal." });
    expect(sale.update).not.toHaveBeenCalled();
  });

  it("cancels a pending sale", async () => {
    const sale = {
      status: STATUS.PENDING,
      update: jest.fn(),
    };
    db.Sale.findOne.mockResolvedValue(sale);

    const { req, res } = createMocks({
      method: "PUT",
      query: { id: 1 },
    });
    req.user = { role: "ADMIN" };

    await TenantContext.run(23, async () => cancelSaleOrder(req, res));

    expect(sale.update).toHaveBeenCalledWith({ status: STATUS.CANCEL });
    expect(res._getStatusCode()).toBe(200);
  });
});
