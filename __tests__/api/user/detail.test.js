import { createMocks } from "node-mocks-http";

import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";
import { deleteUser, updateUser } from "@/pages/api/user/[id]";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  User: {
    findOne: jest.fn(),
    destroy: jest.fn(),
  },
}));

describe("user detail API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates a user within the active organization", async () => {
    const user = {
      id: 12,
      email: "editor@test.com",
      update: jest.fn().mockResolvedValue(),
    };
    db.User.findOne.mockResolvedValue(user);

    const { req, res } = createMocks({
      method: "PUT",
      query: { id: "12" },
      body: {
        firstName: "Editor",
        lastName: "Updated",
        email: "editor@test.com",
        role: "EDITOR",
        status: "ACTIVE",
      },
    });
    req.user = { role: "ADMIN" };

    await TenantContext.run(9, async () => updateUser(req, res));

    expect(db.User.findOne).toHaveBeenCalledWith({
      where: { id: 12, organizationId: 9 },
      attributes: { exclude: ["password"] },
    });
    expect(user.update).toHaveBeenCalledWith({
      firstName: "Editor",
      lastName: "Updated",
      email: "editor@test.com",
      role: "EDITOR",
      status: "ACTIVE",
      id: 12,
    });
    expect(res._getStatusCode()).toBe(200);
  });

  it("deletes a user within the active organization", async () => {
    db.User.findOne.mockResolvedValue({ id: 12 });
    db.User.destroy.mockResolvedValue(1);

    const { req, res } = createMocks({
      method: "DELETE",
      query: { id: "12" },
    });
    req.user = { role: "ADMIN" };

    await TenantContext.run(9, async () => deleteUser(req, res));

    expect(db.User.destroy).toHaveBeenCalledWith({
      where: { id: 12, organizationId: 9 },
    });
    expect(res._getStatusCode()).toBe(200);
  });
});
