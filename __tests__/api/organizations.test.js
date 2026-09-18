import { createMocks } from "node-mocks-http";

import { getOrganization, updateOrganization } from "@/pages/api/organizations/[id]";
import { getOrganizations as listOrganizations } from "@/pages/api/organizations/index";
import db from "@/lib/postgres";

jest.mock("@/lib/postgres", () => ({
  __esModule: true,
  default: {
    dbConnect: jest.fn(),
    Organization: {
      findAll: jest.fn(),
      findByPk: jest.fn(),
    },
  },
}));

describe("organization super admin APIs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.dbConnect.mockResolvedValue();
  });

  it("lists organizations for super admin", async () => {
    db.Organization.findAll.mockResolvedValue([{ id: 1, name: "Acme" }]);

    const { req, res } = createMocks({ method: "GET" });
    req.user = { role: "SUPER_ADMIN" };

    await listOrganizations(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(db.Organization.findAll).toHaveBeenCalledTimes(1);
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

    const { req, res } = createMocks({ method: "GET", query: { id: 11 } });
    req.user = { role: "SUPER_ADMIN" };

    await getOrganization(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(db.Organization.findByPk).toHaveBeenCalledWith(11, { tenantBypass: true });
  });
});
