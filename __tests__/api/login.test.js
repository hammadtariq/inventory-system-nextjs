import { ensureUserOrganization } from "@/pages/api/user/login";
import db from "@/lib/postgres";

jest.mock("@/lib/postgres", () => ({
  Organization: {
    findByPk: jest.fn(),
    findOrCreate: jest.fn(),
  },
}));

describe("ensureUserOrganization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the user's existing organization", async () => {
    const organization = { id: 11, slug: "default", status: "ACTIVE" };
    db.Organization.findByPk.mockResolvedValue(organization);

    const result = await ensureUserOrganization({ organizationId: 11 });

    expect(db.Organization.findByPk).toHaveBeenCalledWith(11);
    expect(db.Organization.findOrCreate).not.toHaveBeenCalled();
    expect(result).toEqual(organization);
  });

  it("assigns legacy users without organizationId to the default organization", async () => {
    const organization = { id: 1, slug: "default", status: "ACTIVE" };
    const user = {
      organizationId: null,
      update: jest.fn().mockResolvedValue(true),
    };
    db.Organization.findOrCreate.mockResolvedValue([organization, true]);

    const result = await ensureUserOrganization(user);

    expect(db.Organization.findOrCreate).toHaveBeenCalledWith({
      where: { slug: "default" },
      defaults: {
        name: "Default",
        plan: "STARTER",
        status: "ACTIVE",
        maxUsers: 5,
      },
      tenantBypass: true,
    });
    expect(user.update).toHaveBeenCalledWith({ organizationId: 1 }, { tenantBypass: true });
    expect(user.organizationId).toBe(1);
    expect(result).toEqual(organization);
  });
});
