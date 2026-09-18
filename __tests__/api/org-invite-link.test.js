import { createMocks } from "node-mocks-http";

import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";
import { resendInvite } from "@/pages/api/org/invite/[id]";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  User: {
    findOne: jest.fn(),
  },
}));

jest.mock("@/middlewares/auth", () => ({
  auth: (req, res, next) => next(),
}));

jest.mock("@/lib/invite-email", () => ({
  sendInviteEmail: jest.fn(),
}));

describe("organization invite link API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("regenerates an invite link without sending email when requested", async () => {
    const invitedUser = {
      id: 22,
      email: "invite@test.com",
      firstName: "New",
      lastName: "User",
      role: "EDITOR",
      status: "INVITED",
      inviteExpiresAt: new Date("2026-05-01"),
      update: jest.fn().mockResolvedValue(),
    };
    db.User.findOne.mockResolvedValue(invitedUser);

    const { req, res } = createMocks({
      method: "POST",
      query: { id: "22" },
      body: { sendEmail: false },
      headers: { host: "localhost:3000" },
    });
    req.user = { role: "ADMIN" };
    req.organization = { name: "Acme" };

    await TenantContext.run(9, async () => resendInvite(req, res));

    expect(invitedUser.update).toHaveBeenCalledWith(
      expect.objectContaining({
        inviteTokenHash: expect.any(String),
        inviteExpiresAt: expect.any(Date),
        invitedAt: expect.any(Date),
      }),
      { tenantBypass: true }
    );
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData().inviteUrl).toContain("/accept-invite?token=");
  });
});
