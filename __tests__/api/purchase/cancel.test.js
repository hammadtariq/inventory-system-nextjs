import { createMocks } from "node-mocks-http";

import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";
import { cancelPurchaseOrder } from "@/pages/api/purchase/cancel/[id]";
import { STATUS } from "@/utils/api.util";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  Purchase: {
    findOne: jest.fn(),
  },
}));

describe("cancelPurchaseOrder", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects approved purchase cancellation because stock reversal is not implemented", async () => {
    const purchase = {
      status: STATUS.APPROVED,
      update: jest.fn(),
    };
    db.Purchase.findOne.mockResolvedValue(purchase);

    const { req, res } = createMocks({
      method: "PUT",
      query: { id: 1 },
    });
    req.user = { role: "ADMIN" };

    await TenantContext.run(23, async () => cancelPurchaseOrder(req, res));

    expect(res._getStatusCode()).toBe(400);
    expect(res._getData()).toEqual({ message: "Approved purchase orders cannot be cancelled without reversal." });
    expect(purchase.update).not.toHaveBeenCalled();
  });

  it("cancels a pending purchase", async () => {
    const purchase = {
      status: STATUS.PENDING,
      update: jest.fn(),
    };
    db.Purchase.findOne.mockResolvedValue(purchase);

    const { req, res } = createMocks({
      method: "PUT",
      query: { id: 1 },
    });
    req.user = { role: "ADMIN" };

    await TenantContext.run(23, async () => cancelPurchaseOrder(req, res));

    expect(purchase.update).toHaveBeenCalledWith({ status: STATUS.CANCEL });
    expect(res._getStatusCode()).toBe(200);
  });
});
