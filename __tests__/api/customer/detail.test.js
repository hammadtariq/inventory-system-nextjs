import { createMocks } from "node-mocks-http";

import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";
import { getCustomer } from "@/pages/api/customer/[id]";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  Customer: {
    findOne: jest.fn(),
  },
}));

describe("customer detail API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 404 when another organization requests the customer", async () => {
    db.Customer.findOne.mockResolvedValue(null);

    const { req, res } = createMocks({
      method: "GET",
      query: { id: "77" },
    });

    await TenantContext.run(11, async () => getCustomer(req, res));

    expect(db.Customer.findOne).toHaveBeenCalledWith({
      where: { id: "77", organizationId: 11 },
    });
    expect(res._getStatusCode()).toBe(404);
    expect(res._getData()).toEqual({ message: "Customer not exist" });
  });
});
