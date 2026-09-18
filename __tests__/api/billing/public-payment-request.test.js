import { createMocks } from "node-mocks-http";

import { createPublicPaymentRequest } from "@/pages/api/checkout/payment-request";
import { getPublicPaymentRequests } from "@/pages/api/admin/public-payment-requests/index";
import { reviewPublicPaymentRequest } from "@/pages/api/admin/public-payment-requests/[id]";
import db from "@/lib/postgres";

jest.mock("@/lib/postgres", () => ({
  __esModule: true,
  default: {
    dbConnect: jest.fn(),
    Sequelize: { Op: { gte: Symbol("gte") } },
    PublicPaymentRequest: {
      create: jest.fn(),
      count: jest.fn(),
      findAndCountAll: jest.fn(),
      findByPk: jest.fn(),
    },
  },
}));

jest.mock("@/lib/invite-email", () => ({
  sendPaymentConfirmedEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock("sharp", () => jest.fn(() => ({ metadata: jest.fn().mockResolvedValue({ format: "png" }) })));

const proofImage = "data:image/png;base64,aGVsbG8=";

const basePayload = {
  packageSlug: "quarterly",
  businessName: "Acme Traders",
  contactName: "Ali Khan",
  email: "ali@example.com",
  phone: "03330000000",
  referenceNumber: "RAAST-444",
  senderAccountNumber: "0012345678",
  amountPaid: 100,
  paidAt: new Date().toISOString(),
  proofImage,
  proofFileName: "proof.png",
  proofMimeType: "image/png",
};

describe("public checkout payment requests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.dbConnect.mockResolvedValue();
    db.PublicPaymentRequest.count.mockResolvedValue(0);
  });

  it("creates a public payment request with screenshot proof", async () => {
    db.PublicPaymentRequest.create.mockResolvedValue({
      id: 4,
      uuid: "request-uuid",
      status: "PENDING",
    });

    const { req, res } = createMocks({
      method: "POST",
      body: basePayload,
    });

    await createPublicPaymentRequest(req, res);

    expect(res._getStatusCode()).toBe(201);
    expect(db.PublicPaymentRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        packageSlug: "quarterly",
        packageName: "Quarterly",
        businessName: "Acme Traders",
        email: "ali@example.com",
        referenceNumber: "RAAST-444",
        senderAccountNumber: "0012345678",
        amountPaid: 100,
        proofImage,
        status: "PENDING",
      })
    );
  });

  it("rejects public payment request without screenshot proof", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: {
        packageSlug: "monthly",
        businessName: "Acme Traders",
        contactName: "Ali Khan",
        email: "ali@example.com",
        referenceNumber: "RAAST-444",
      },
    });

    await createPublicPaymentRequest(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(db.PublicPaymentRequest.create).not.toHaveBeenCalled();
  });

  it("rejects public payment request missing sender account number, amount, or date", async () => {
    const { senderAccountNumber, ...withoutAccount } = basePayload;
    void senderAccountNumber;
    const { req, res } = createMocks({ method: "POST", body: withoutAccount });

    await createPublicPaymentRequest(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(db.PublicPaymentRequest.create).not.toHaveBeenCalled();
  });

  it("throttles repeated submissions from the same email", async () => {
    db.PublicPaymentRequest.count.mockResolvedValue(5);

    const { req, res } = createMocks({ method: "POST", body: basePayload });

    await createPublicPaymentRequest(req, res);

    expect(res._getStatusCode()).toBe(429);
    expect(db.PublicPaymentRequest.create).not.toHaveBeenCalled();
  });

  it("lets a super admin confirm a public payment request for onboarding", async () => {
    const request = {
      id: 4,
      status: "PENDING",
      email: "ali@example.com",
      businessName: "Acme Traders",
      packageName: "Quarterly",
      update: jest.fn().mockResolvedValue(),
    };
    db.PublicPaymentRequest.findByPk.mockResolvedValue(request);

    const { req, res } = createMocks({
      method: "PUT",
      query: { id: 4 },
      body: { status: "APPROVED", adminNote: "Payment verified" },
    });
    req.user = { id: 8, role: "SUPER_ADMIN" };

    await reviewPublicPaymentRequest(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(request.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "APPROVED",
        adminNote: "Payment verified",
        reviewedByUserId: 8,
      })
    );
  });

  it("blocks a tenant ADMIN from reviewing public payment requests", async () => {
    const { req, res } = createMocks({
      method: "PUT",
      query: { id: 4 },
      body: { status: "APPROVED", adminNote: "Payment verified" },
    });
    req.user = { id: 9, role: "ADMIN" };

    await reviewPublicPaymentRequest(req, res);

    expect(res._getStatusCode()).toBe(403);
    expect(db.PublicPaymentRequest.findByPk).not.toHaveBeenCalled();
  });

  it("blocks a tenant ADMIN from listing public payment requests", async () => {
    const { req, res } = createMocks({ method: "GET", query: {} });
    req.user = { id: 9, role: "ADMIN" };

    await getPublicPaymentRequests(req, res);

    expect(res._getStatusCode()).toBe(403);
    expect(db.PublicPaymentRequest.findAndCountAll).not.toHaveBeenCalled();
  });
});
