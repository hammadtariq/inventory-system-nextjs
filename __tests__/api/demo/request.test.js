import { createMocks } from "node-mocks-http";

import { createDemoRequest } from "@/pages/api/demo/request";
import { sendDemoRequestEmails } from "@/lib/invite-email";

jest.mock("@/lib/invite-email", () => ({
  sendDemoRequestEmails: jest.fn().mockResolvedValue(undefined),
}));

const basePayload = {
  fullName: "Ali Khan",
  email: "ali@example.com",
  companyName: "Acme Traders",
  teamSize: "11-50",
};

describe("public demo requests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sends demo request emails and confirms receipt", async () => {
    const { req, res } = createMocks({ method: "POST", body: basePayload });

    await createDemoRequest(req, res);

    expect(res._getStatusCode()).toBe(201);
    expect(sendDemoRequestEmails).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: "Ali Khan",
        email: "ali@example.com",
        companyName: "Acme Traders",
        teamSize: "11-50",
      })
    );
  });

  it("rejects a request missing required fields", async () => {
    const { companyName, ...withoutCompany } = basePayload;
    void companyName;
    const { req, res } = createMocks({ method: "POST", body: withoutCompany });

    await createDemoRequest(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(sendDemoRequestEmails).not.toHaveBeenCalled();
  });

  it("rejects an invalid team size", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { ...basePayload, teamSize: "not-a-real-size" },
    });

    await createDemoRequest(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(sendDemoRequestEmails).not.toHaveBeenCalled();
  });

  it("throttles repeated submissions from the same email", async () => {
    const throttledPayload = { ...basePayload, email: "throttle-me@example.com" };

    for (let i = 0; i < 5; i += 1) {
      const { req, res } = createMocks({ method: "POST", body: throttledPayload });
      await createDemoRequest(req, res);
      expect(res._getStatusCode()).toBe(201);
    }

    const { req, res } = createMocks({ method: "POST", body: throttledPayload });
    await createDemoRequest(req, res);

    expect(res._getStatusCode()).toBe(429);
    expect(sendDemoRequestEmails).toHaveBeenCalledTimes(5);
  });

  it("returns 500 when sending the emails fails", async () => {
    sendDemoRequestEmails.mockRejectedValueOnce(new Error("Resend failed with status 422"));
    const { req, res } = createMocks({
      method: "POST",
      body: { ...basePayload, email: "failure@example.com" },
    });

    await createDemoRequest(req, res);

    expect(res._getStatusCode()).toBe(500);
  });
});
