import { createMocks } from "node-mocks-http";

import { registerOrg } from "@/pages/api/org/register";
import { inviteUser } from "@/pages/api/org/invite";
import { acceptInvite } from "@/pages/api/org/accept-invite";
import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";

jest.mock("@/lib/postgres", () => ({
  __esModule: true,
  default: {
    dbConnect: jest.fn(),
    sequelize: {
      transaction: jest.fn(),
    },
    Organization: {
      create: jest.fn(),
      findOne: jest.fn(),
      findByPk: jest.fn(),
    },
    User: {
      count: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
    },
  },
}));

jest.mock("@/middlewares/auth", () => ({
  auth: (req, res, next) => next(),
}));

describe("organization onboarding APIs", () => {
  const transaction = {
    commit: jest.fn(),
    rollback: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    db.dbConnect.mockResolvedValue();
    db.sequelize.transaction.mockResolvedValue(transaction);
  });

  it("registers an organization and admin user", async () => {
    db.Organization.findOne.mockResolvedValue(null);
    db.User.findOne.mockResolvedValue(null);
    db.Organization.create.mockResolvedValue({
      id: 11,
      uuid: "org-uuid",
      name: "Acme",
      slug: "acme",
    });
    db.User.create.mockResolvedValue({
      id: 22,
      uuid: "user-uuid",
      firstName: "admin",
      lastName: "user",
      email: "admin@example.com",
      role: "ADMIN",
      organizationId: 11,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    });

    const { req, res } = createMocks({
      method: "POST",
      headers: { host: "localhost:3000" },
      body: {
        organizationName: "Acme",
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        password: "password123",
      },
    });

    await registerOrg(req, res);

    expect(res._getStatusCode()).toBe(201);
    expect(db.Organization.create).toHaveBeenCalledWith(expect.objectContaining({ slug: "acme" }), expect.anything());
    expect(db.User.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: "ADMIN", organizationId: 11 }),
      expect.anything()
    );
    expect(transaction.commit).toHaveBeenCalled();
  });

  it("preserves hyphenated organization slugs", async () => {
    db.Organization.findOne.mockResolvedValue(null);
    db.User.findOne.mockResolvedValue(null);
    db.Organization.create.mockResolvedValue({
      id: 11,
      uuid: "org-uuid",
      name: "True Refined Solution",
      slug: "true-refined-solution",
    });
    db.User.create.mockResolvedValue({
      id: 22,
      uuid: "user-uuid",
      firstName: "hammad",
      lastName: "tariq",
      email: "hammad@example.com",
      role: "ADMIN",
      organizationId: 11,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    });

    const { req, res } = createMocks({
      method: "POST",
      headers: { host: "localhost:3000" },
      body: {
        organizationName: "True Refined Solution",
        slug: "true-refined-solution",
        firstName: "Hammad",
        lastName: "Tariq",
        email: "hammad@example.com",
        password: "password123",
      },
    });

    await registerOrg(req, res);

    expect(res._getStatusCode()).toBe(201);
    expect(db.Organization.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: "true-refined-solution" } })
    );
    expect(db.Organization.create).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "true-refined-solution" }),
      expect.anything()
    );
  });

  it("creates an invite for an admin within seat limit", async () => {
    db.User.count.mockResolvedValue(1);
    db.User.findOne.mockResolvedValue(null);
    db.User.create.mockResolvedValue({
      id: 33,
      uuid: "invite-uuid",
      firstName: "new",
      lastName: "user",
      email: "new@example.com",
      role: "EDITOR",
      status: "INVITED",
      inviteExpiresAt: new Date("2026-01-08"),
    });

    const { req, res } = createMocks({
      method: "POST",
      headers: { host: "localhost:3000" },
      body: {
        firstName: "New",
        lastName: "User",
        email: "new@example.com",
        role: "EDITOR",
      },
    });
    req.user = { role: "ADMIN" };
    req.organization = { id: 44, maxUsers: 5 };

    await TenantContext.run(44, async () => inviteUser(req, res));

    expect(res._getStatusCode()).toBe(201);
    expect(db.User.create).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 44, status: "INVITED", inviteTokenHash: expect.any(String) }),
      { tenantBypass: true }
    );
    expect(res._getData().inviteUrl).toContain("/accept-invite?token=");
  });

  it("accepts a valid invite and activates the user", async () => {
    const invitedUser = {
      id: 55,
      uuid: "invited-user",
      firstName: "new",
      lastName: "user",
      email: "new@example.com",
      role: "EDITOR",
      organizationId: 66,
      inviteExpiresAt: new Date(Date.now() + 60_000),
      update: jest.fn().mockResolvedValue(),
    };
    db.User.findOne.mockResolvedValue(invitedUser);
    db.Organization.findByPk.mockResolvedValue({
      id: 66,
      uuid: "org-uuid",
      slug: "acme",
      status: "ACTIVE",
    });

    const { req, res } = createMocks({
      method: "POST",
      body: {
        token: "a".repeat(64),
        password: "password123",
      },
    });

    await acceptInvite(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(invitedUser.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "ACTIVE", inviteTokenHash: null }),
      { tenantBypass: true }
    );
  });
});
