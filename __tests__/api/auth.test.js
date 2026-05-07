import { createMocks } from "node-mocks-http";
import { auth } from "@/middlewares/auth";
import TenantContext from "@/lib/tenant-context";
import db from "@/lib/postgres";
import { getTokenCookie } from "@/lib/auth-cookies";
import Iron from "@hapi/iron";

jest.mock("@/lib/auth-cookies", () => ({
  getTokenCookie: jest.fn(),
}));

jest.mock("@hapi/iron", () => ({
  defaults: {},
  unseal: jest.fn(),
}));

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  sequelize: {
    transaction: jest.fn(),
    query: jest.fn(),
  },
  User: {
    findOne: jest.fn(),
  },
  Organization: {
    findByPk: jest.fn(),
  },
}));

describe("auth tenant bootstrap", () => {
  const tokenPayload = {
    user: {
      id: 7,
      organizationId: 11,
    },
    token: {
      maxAge: new Date(Date.now() + 60 * 1000),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const transaction = {
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
    };
    db.sequelize.transactionObject = transaction;
    db.sequelize.transaction.mockResolvedValue(transaction);
    db.sequelize.query.mockResolvedValue();
    getTokenCookie.mockReturnValue("sealed-token");
    Iron.unseal.mockResolvedValue(tokenPayload);
    db.User.findOne.mockResolvedValue({
      id: 7,
      email: "admin@test.com",
      organizationId: 11,
    });
    db.Organization.findByPk.mockResolvedValue({
      id: 11,
      name: "Default",
      status: "ACTIVE",
    });
  });

  it("loads the user and organization, then runs next in tenant context", async () => {
    const { req, res } = createMocks({ method: "GET" });
    const next = jest.fn(() => {
      expect(TenantContext.get()).toBe(11);
      expect(TenantContext.getTransaction()).toBe(db.sequelize.transactionObject);
    });

    await auth(req, res, next);

    expect(db.User.findOne).toHaveBeenCalledWith({
      where: { id: 7 },
      attributes: { exclude: ["password"] },
      tenantBypass: true,
    });
    expect(db.Organization.findByPk).toHaveBeenCalledWith(11, { tenantBypass: true });
    expect(req.user.organizationId).toBe(11);
    expect(req.organization.id).toBe(11);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("allows super admin to run requests in a selected organization scope", async () => {
    db.User.findOne.mockResolvedValue({
      id: 7,
      email: "super@test.com",
      role: "SUPER_ADMIN",
      organizationId: 11,
    });
    db.Organization.findByPk.mockResolvedValue({
      id: 22,
      name: "Client Org",
      status: "ACTIVE",
    });

    const { req, res } = createMocks({
      method: "GET",
      headers: { "x-organization-id": "22" },
    });
    const next = jest.fn(() => {
      expect(TenantContext.get()).toBe(22);
    });

    await auth(req, res, next);

    expect(db.Organization.findByPk).toHaveBeenCalledWith(22, { tenantBypass: true });
    expect(db.sequelize.query).toHaveBeenCalledWith("SET LOCAL app.tenant_id = :organizationId", {
      transaction: db.sequelize.transactionObject,
      replacements: { organizationId: 22 },
    });
    expect(req.user.organizationId).toBe(11);
    expect(req.organization.id).toBe(22);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("rejects tokens without organizationId", async () => {
    Iron.unseal.mockResolvedValue({
      ...tokenPayload,
      user: { id: 7 },
    });

    const { req, res } = createMocks({ method: "GET" });

    await auth(req, res, jest.fn());

    expect(res._getStatusCode()).toBe(401);
    expect(res._getData()).toEqual({ message: "Invalid token (missing organization)" });
  });

  it("rejects tokens that do not match the user's current organization", async () => {
    db.User.findOne.mockResolvedValue({
      id: 7,
      email: "admin@test.com",
      organizationId: 12,
    });

    const { req, res } = createMocks({ method: "GET" });

    await auth(req, res, jest.fn());

    expect(res._getStatusCode()).toBe(401);
    expect(res._getData()).toEqual({ message: "Token validation failed" });
  });

  it("rejects suspended organizations", async () => {
    db.Organization.findByPk.mockResolvedValue({
      id: 11,
      name: "Default",
      status: "SUSPENDED",
    });

    const { req, res } = createMocks({ method: "GET" });

    await auth(req, res, jest.fn());

    expect(res._getStatusCode()).toBe(403);
    expect(res._getData()).toEqual({ message: "Organization suspended" });
  });
});
