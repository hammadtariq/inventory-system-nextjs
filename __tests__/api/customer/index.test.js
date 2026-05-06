import { createMocks } from "node-mocks-http";

import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";
import { customerRegistration, getAllCustomers } from "@/pages/api/customer/index";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  Customer: {
    findOne: jest.fn(),
    create: jest.fn(),
    findAndCountAll: jest.fn(),
  },
}));

describe("customer APIs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("scopes customer duplicates to the active organization", async () => {
    db.Customer.findOne.mockResolvedValue(null);
    db.Customer.create.mockResolvedValue({});

    const { req, res } = createMocks({
      method: "POST",
      body: {
        firstName: "Hammad",
        lastName: "Tariq",
        email: "same@example.com",
        phone: "1234567890",
        address: "1234 Main Street",
      },
    });

    await TenantContext.run(11, async () => customerRegistration(req, res));

    expect(db.Customer.findOne).toHaveBeenCalledWith({
      where: {
        email: "same@example.com",
        organizationId: 11,
      },
    });
    expect(db.Customer.create).toHaveBeenCalledWith({
      firstName: "Hammad",
      lastName: "Tariq",
      email: "same@example.com",
      phone: "1234567890",
      address: "1234 Main Street",
      organizationId: 11,
    });
    expect(res._getStatusCode()).toBe(200);
  });

  it("rejects a customer payload that attempts to smuggle organizationId", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: {
        firstName: "Hammad",
        lastName: "Tariq",
        email: "same@example.com",
        phone: "1234567890",
        address: "1234 Main Street",
        organizationId: 99,
      },
    });

    await TenantContext.run(11, async () => customerRegistration(req, res));

    expect(res._getStatusCode()).toBe(400);
    expect(db.Customer.create).not.toHaveBeenCalled();
  });

  it("returns only customers for the active organization", async () => {
    db.Customer.findAndCountAll.mockResolvedValue({
      count: 2,
      rows: [
        { id: 1, email: "same@example.com", organizationId: 9 },
        { id: 2, email: "other@example.com", organizationId: 9 },
      ],
    });

    const { req, res } = createMocks({
      method: "GET",
      query: {},
    });
    req.user = { role: "ADMIN" };

    await TenantContext.run(9, async () => getAllCustomers(req, res));

    expect(db.Customer.findAndCountAll).toHaveBeenCalledWith({
      limit: 1000,
      offset: 0,
      where: { organizationId: 9 },
      order: [["updatedAt", "DESC"]],
    });
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toEqual({
      count: 2,
      rows: [
        { id: 1, email: "same@example.com", organizationId: 9 },
        { id: 2, email: "other@example.com", organizationId: 9 },
      ],
    });
  });
});
