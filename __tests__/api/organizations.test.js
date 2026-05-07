import { createMocks } from "node-mocks-http";

import { deleteOrganization, getOrganization, updateOrganization } from "@/pages/api/organizations/[id]";
import { getOrganizations as listOrganizations } from "@/pages/api/organizations/index";
import db from "@/lib/postgres";

jest.mock("@/lib/postgres", () => ({
  __esModule: true,
  default: {
    dbConnect: jest.fn(),
    sequelize: {
      transaction: jest.fn(),
      query: jest.fn(),
    },
    Organization: {
      findAll: jest.fn(),
      findByPk: jest.fn(),
    },
    User: {
      findAll: jest.fn(),
      destroy: jest.fn(),
    },
    SaleReturn: { destroy: jest.fn() },
    PurchaseHistory: { destroy: jest.fn() },
    Ledger: { destroy: jest.fn() },
    Cheque: { destroy: jest.fn() },
    Sale: { destroy: jest.fn() },
    Purchase: { destroy: jest.fn() },
    Inventory: { destroy: jest.fn() },
    Items: { destroy: jest.fn() },
    Customer: { destroy: jest.fn() },
    Company: { destroy: jest.fn() },
  },
}));

describe("organization super admin APIs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.dbConnect.mockResolvedValue();
    db.sequelize.transaction.mockResolvedValue({
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
    });
    db.sequelize.query.mockResolvedValue();
  });

  it("lists organizations for super admin", async () => {
    db.Organization.findAll.mockResolvedValue([{ id: 1, name: "Acme" }]);
    db.User.findAll.mockResolvedValue([{ id: 2, email: "admin@acme.test", role: "ADMIN", organizationId: 1 }]);

    const { req, res } = createMocks({ method: "GET" });
    req.user = { role: "SUPER_ADMIN" };

    await listOrganizations(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(db.Organization.findAll).toHaveBeenCalledTimes(1);
    expect(res._getData()).toEqual({
      count: 1,
      rows: [
        {
          id: 1,
          name: "Acme",
          email: "admin@acme.test",
          usersCount: 1,
          users: [{ id: 2, email: "admin@acme.test", role: "ADMIN", organizationId: 1 }],
        },
      ],
    });
  });

  it("filters organizations by search text", async () => {
    db.Organization.findAll.mockResolvedValue([
      { id: 1, name: "Acme", slug: "acme" },
      { id: 2, name: "Beta", slug: "beta" },
    ]);
    db.User.findAll.mockResolvedValue([{ id: 3, email: "owner@beta.test", role: "ADMIN", organizationId: 2 }]);

    const { req, res } = createMocks({ method: "GET", query: { q: "owner@beta" } });
    req.user = { role: "SUPER_ADMIN" };

    await listOrganizations(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getData().count).toBe(1);
    expect(res._getData().rows[0].id).toBe(2);
  });

  it("rejects non super admin access", async () => {
    const { req, res } = createMocks({ method: "GET" });
    req.user = { role: "ADMIN" };

    await listOrganizations(req, res);

    expect(res._getStatusCode()).toBe(403);
  });

  it("updates organization fields for super admin", async () => {
    const organization = {
      id: 11,
      update: jest.fn().mockResolvedValue(),
    };
    db.Organization.findByPk.mockResolvedValue(organization);

    const { req, res } = createMocks({
      method: "PUT",
      query: { id: 11 },
      body: { name: "Updated", status: "SUSPENDED", plan: "PRO", maxUsers: 10 },
    });
    req.user = { role: "SUPER_ADMIN" };

    await updateOrganization(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(organization.update).toHaveBeenCalledWith(
      { name: "Updated", status: "SUSPENDED", plan: "PRO", maxUsers: 10 },
      { tenantBypass: true }
    );
  });

  it("loads a single organization for super admin", async () => {
    db.Organization.findByPk.mockResolvedValue({ id: 11, name: "Acme" });
    db.User.findAll.mockResolvedValue([{ id: 2, email: "admin@acme.test", role: "ADMIN", organizationId: 11 }]);

    const { req, res } = createMocks({ method: "GET", query: { id: 11 } });
    req.user = { role: "SUPER_ADMIN" };

    await getOrganization(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(db.Organization.findByPk).toHaveBeenCalledWith(11, { tenantBypass: true });
    expect(res._getData().email).toBe("admin@acme.test");
  });

  it("deletes an organization and its tenant data for super admin", async () => {
    const organization = {
      id: 22,
      destroy: jest.fn().mockResolvedValue(),
    };
    db.Organization.findByPk.mockResolvedValue(organization);

    const { req, res } = createMocks({ method: "DELETE", query: { id: 22 } });
    req.user = { role: "SUPER_ADMIN", organizationId: 11 };

    await deleteOrganization(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(db.sequelize.query).toHaveBeenCalledWith("SET LOCAL app.tenant_id = :organizationId", {
      transaction: expect.any(Object),
      replacements: { organizationId: 22 },
    });
    expect(db.SaleReturn.destroy).toHaveBeenCalledWith({
      where: { organizationId: 22 },
      transaction: expect.any(Object),
      tenantBypass: true,
    });
    expect(db.User.destroy).toHaveBeenCalledWith({
      where: { organizationId: 22 },
      transaction: expect.any(Object),
      tenantBypass: true,
    });
    expect(organization.destroy).toHaveBeenCalledWith({ transaction: expect.any(Object), tenantBypass: true });
  });

  it("does not allow deleting the super admin login organization", async () => {
    const { req, res } = createMocks({ method: "DELETE", query: { id: 11 } });
    req.user = { role: "SUPER_ADMIN", organizationId: 11 };

    await deleteOrganization(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(db.Organization.findByPk).not.toHaveBeenCalled();
  });
});
