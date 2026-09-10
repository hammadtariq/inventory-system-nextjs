import { createPayment } from "@/pages/api/ledger/createPayment";
import db from "@/lib/postgres";
import { createLedgerPayment } from "@/lib/ledger";
import { createMocks } from "node-mocks-http";
import TenantContext from "@/lib/tenant-context";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  Company: { findOne: jest.fn() },
  Customer: { findOne: jest.fn() },
  Cheque: { create: jest.fn() },
}));

jest.mock("@/lib/ledger", () => ({
  createLedgerPayment: jest.fn(),
}));

const ORG_ID = 42;
const PAYMENT_DATE = "2026-09-07T00:00:00.000Z";

describe("createPayment API", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    ({ req, res } = createMocks({ method: "POST" }));
    db.dbConnect.mockResolvedValue(true);
    db.Company.findOne.mockResolvedValue({ id: 1 });
    db.Customer.findOne.mockResolvedValue({ id: 5 });
    createLedgerPayment.mockResolvedValue({ id: 99 });
  });

  const run = (body) => {
    req.body = body;
    return TenantContext.run(ORG_ID, () => createPayment(req, res));
  };

  it("creates a legacy Company/Customer payment", async () => {
    await run({
      companyId: 1,
      customerId: 5,
      totalAmount: 1000,
      spendType: "DEBIT",
      paymentType: "CASH",
      paymentDate: PAYMENT_DATE,
    });

    expect(res.statusCode).toBe(200);
    expect(db.Company.findOne).toHaveBeenCalledWith({ where: { id: 1, organizationId: ORG_ID } });
    expect(db.Customer.findOne).toHaveBeenCalledWith({ where: { id: 5, organizationId: ORG_ID } });
    expect(createLedgerPayment).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: 1, customerId: 5, totalAmount: 1000 })
    );
  });

  it("creates a legacy customerId-only refund-style payment", async () => {
    await run({
      customerId: 5,
      totalAmount: 1000,
      spendType: "CREDIT",
      paymentType: "REFUND",
      paymentDate: PAYMENT_DATE,
    });

    expect(res.statusCode).toBe(200);
    expect(db.Company.findOne).not.toHaveBeenCalled();
    expect(createLedgerPayment).toHaveBeenCalledWith(expect.objectContaining({ customerId: 5 }));
  });

  it("creates a Pay To Company / Pay By Customer role payload", async () => {
    await run({
      payToType: "company",
      payToId: 1,
      payByType: "customer",
      payById: 5,
      totalAmount: 1000,
      spendType: "DEBIT",
      paymentType: "CASH",
      paymentDate: PAYMENT_DATE,
    });

    expect(res.statusCode).toBe(200);
    expect(createLedgerPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        payToCompanyId: 1,
        payToCustomerId: null,
        payByCompanyId: null,
        payByCustomerId: 5,
      })
    );
  });

  it("creates a Pay To Customer / Pay By Company role payload", async () => {
    await run({
      payToType: "customer",
      payToId: 5,
      payByType: "company",
      payById: 1,
      totalAmount: 1000,
      spendType: "DEBIT",
      paymentType: "CASH",
      paymentDate: PAYMENT_DATE,
    });

    expect(res.statusCode).toBe(200);
    expect(createLedgerPayment).toHaveBeenCalledWith(
      expect.objectContaining({ payToCustomerId: 5, payByCompanyId: 1 })
    );
  });

  it("creates a Pay To Company / Pay By Company role payload with different companies", async () => {
    await run({
      payToType: "company",
      payToId: 1,
      payByType: "company",
      payById: 2,
      totalAmount: 1000,
      spendType: "DEBIT",
      paymentType: "CASH",
      paymentDate: PAYMENT_DATE,
    });

    expect(res.statusCode).toBe(200);
    expect(createLedgerPayment).toHaveBeenCalledWith(expect.objectContaining({ payToCompanyId: 1, payByCompanyId: 2 }));
  });

  it("creates a Pay To Customer / Pay By Customer role payload with different customers", async () => {
    await run({
      payToType: "customer",
      payToId: 5,
      payByType: "customer",
      payById: 6,
      totalAmount: 1000,
      spendType: "DEBIT",
      paymentType: "CASH",
      paymentDate: PAYMENT_DATE,
    });

    expect(res.statusCode).toBe(200);
    expect(createLedgerPayment).toHaveBeenCalledWith(
      expect.objectContaining({ payToCustomerId: 5, payByCustomerId: 6 })
    );
  });

  it("rejects the same company on both sides", async () => {
    await run({
      payToType: "company",
      payToId: 1,
      payByType: "company",
      payById: 1,
      totalAmount: 1000,
      spendType: "DEBIT",
      paymentType: "CASH",
      paymentDate: PAYMENT_DATE,
    });

    expect(res.statusCode).toBe(400);
    expect(createLedgerPayment).not.toHaveBeenCalled();
  });

  it("rejects the same customer on both sides", async () => {
    await run({
      payToType: "customer",
      payToId: 5,
      payByType: "customer",
      payById: 5,
      totalAmount: 1000,
      spendType: "DEBIT",
      paymentType: "CASH",
      paymentDate: PAYMENT_DATE,
    });

    expect(res.statusCode).toBe(400);
    expect(createLedgerPayment).not.toHaveBeenCalled();
  });

  it("does not block same-type payments between different companies", async () => {
    await run({
      payToType: "company",
      payToId: 1,
      payByType: "company",
      payById: 2,
      totalAmount: 1000,
      spendType: "DEBIT",
      paymentType: "CASH",
      paymentDate: PAYMENT_DATE,
    });

    expect(res.statusCode).toBe(200);
  });

  it("rejects an invalid party type", async () => {
    await run({
      payToType: "vendor",
      payToId: 1,
      payByType: "customer",
      payById: 5,
      totalAmount: 1000,
      spendType: "DEBIT",
      paymentType: "CASH",
      paymentDate: PAYMENT_DATE,
    });

    expect(res.statusCode).toBe(400);
    expect(createLedgerPayment).not.toHaveBeenCalled();
  });

  it("rejects missing role fields for a new payload", async () => {
    await run({
      payToType: "company",
      payToId: 1,
      totalAmount: 1000,
      spendType: "DEBIT",
      paymentType: "CASH",
      paymentDate: PAYMENT_DATE,
    });

    expect(res.statusCode).toBe(400);
    expect(createLedgerPayment).not.toHaveBeenCalled();
  });

  it("rejects a nonexistent company id", async () => {
    db.Company.findOne.mockResolvedValue(null);

    await run({
      payToType: "company",
      payToId: 999,
      payByType: "customer",
      payById: 5,
      totalAmount: 1000,
      spendType: "DEBIT",
      paymentType: "CASH",
      paymentDate: PAYMENT_DATE,
    });

    expect(res.statusCode).toBe(404);
    expect(createLedgerPayment).not.toHaveBeenCalled();
  });

  it("rejects a nonexistent customer id on the legacy path", async () => {
    db.Customer.findOne.mockResolvedValue(null);

    await run({
      customerId: 999,
      totalAmount: 1000,
      spendType: "CREDIT",
      paymentType: "REFUND",
      paymentDate: PAYMENT_DATE,
    });

    expect(res.statusCode).toBe(404);
    expect(createLedgerPayment).not.toHaveBeenCalled();
  });

  it("rejects a non-positive amount", async () => {
    await run({
      companyId: 1,
      customerId: 5,
      totalAmount: 0,
      spendType: "DEBIT",
      paymentType: "CASH",
      paymentDate: PAYMENT_DATE,
    });

    expect(res.statusCode).toBe(400);
    expect(createLedgerPayment).not.toHaveBeenCalled();
  });

  it("requires chequeId and dueDate for CHEQUE payments", async () => {
    await run({
      companyId: 1,
      customerId: 5,
      totalAmount: 1000,
      spendType: "DEBIT",
      paymentType: "CHEQUE",
      paymentDate: PAYMENT_DATE,
    });

    expect(res.statusCode).toBe(400);
    expect(createLedgerPayment).not.toHaveBeenCalled();
  });

  it("does not require chequeId and dueDate for non-CHEQUE payments", async () => {
    await run({
      companyId: 1,
      customerId: 5,
      totalAmount: 1000,
      spendType: "DEBIT",
      paymentType: "CASH",
      paymentDate: PAYMENT_DATE,
    });

    expect(res.statusCode).toBe(200);
  });

  it("creates a Cheque record and passes through for CHEQUE payments", async () => {
    await run({
      companyId: 1,
      customerId: 5,
      totalAmount: 1000,
      spendType: "DEBIT",
      paymentType: "CHEQUE",
      paymentDate: PAYMENT_DATE,
      chequeId: "CHQ-1",
      dueDate: "2026-09-10T00:00:00.000Z",
    });

    expect(res.statusCode).toBe(200);
    expect(db.Cheque.create).toHaveBeenCalledWith(
      expect.objectContaining({
        chequeId: "CHQ-1",
        dueDate: "2026-09-10T00:00:00.000Z",
        status: "PENDING",
        organizationId: ORG_ID,
      })
    );
  });

  it("preserves the Other sentinel for the default Pay To Company / Pay By Customer combo", async () => {
    await run({
      payToType: "company",
      payToId: -1,
      payByType: "customer",
      payById: 5,
      totalAmount: 1000,
      spendType: "DEBIT",
      paymentType: "CASH",
      paymentDate: PAYMENT_DATE,
      otherName: "Cash Buyer",
    });

    expect(res.statusCode).toBe(200);
    expect(db.Company.findOne).not.toHaveBeenCalled();
    expect(createLedgerPayment).toHaveBeenCalledWith(
      expect.objectContaining({ payToCompanyId: null, payByCustomerId: 5, otherName: "Cash Buyer" })
    );
  });

  it("rejects Other on a non-default combo", async () => {
    await run({
      payToType: "customer",
      payToId: -1,
      payByType: "company",
      payById: 1,
      totalAmount: 1000,
      spendType: "DEBIT",
      paymentType: "CASH",
      paymentDate: PAYMENT_DATE,
    });

    expect(res.statusCode).toBe(400);
    expect(createLedgerPayment).not.toHaveBeenCalled();
  });

  it("rejects both sides as Other", async () => {
    await run({
      payToType: "company",
      payToId: -1,
      payByType: "customer",
      payById: -1,
      totalAmount: 1000,
      spendType: "DEBIT",
      paymentType: "CASH",
      paymentDate: PAYMENT_DATE,
    });

    expect(res.statusCode).toBe(400);
    expect(createLedgerPayment).not.toHaveBeenCalled();
  });

  it("returns 500 when ledger creation throws", async () => {
    createLedgerPayment.mockRejectedValue(new Error("DB down"));

    await run({
      companyId: 1,
      customerId: 5,
      totalAmount: 1000,
      spendType: "DEBIT",
      paymentType: "CASH",
      paymentDate: PAYMENT_DATE,
    });

    expect(res.statusCode).toBe(500);
  });
});
