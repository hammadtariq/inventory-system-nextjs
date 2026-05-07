import { createMocks } from "node-mocks-http";

import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";
import { getAllUsers } from "@/pages/api/user/index";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  User: {
    findAndCountAll: jest.fn(),
  },
}));

describe("getAllUsers API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns users only for the active organization", async () => {
    db.User.findAndCountAll.mockResolvedValue({
      count: 2,
      rows: [
        { id: 1, email: "admin@test.com", organizationId: 9 },
        { id: 2, email: "invite@test.com", organizationId: 9 },
      ],
    });

    const { req, res } = createMocks({
      method: "GET",
      query: {},
    });
    req.user = { role: "ADMIN" };

    await TenantContext.run(9, async () => getAllUsers(req, res));

    expect(db.User.findAndCountAll).toHaveBeenCalledWith({
      limit: 1000,
      offset: 0,
      where: { organizationId: 9 },
      attributes: { exclude: ["password"] },
      order: [["updatedAt", "DESC"]],
    });
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toEqual({
      count: 2,
      rows: [
        { id: 1, email: "admin@test.com", organizationId: 9 },
        { id: 2, email: "invite@test.com", organizationId: 9 },
      ],
    });
  });
});
