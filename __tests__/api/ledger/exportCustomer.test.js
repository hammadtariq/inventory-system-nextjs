import { createMocks } from "node-mocks-http";

import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";
import { exportCustomerLedger } from "@/pages/api/ledger/exportCustomer";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  Ledger: { findAll: jest.fn() },
  Company: {},
  Customer: {},
  sequelize: { query: jest.fn() },
  Sequelize: { QueryTypes: { SELECT: "SELECT" } },
}));

const ORG_ID = 42;

const mockRow = (data) => ({
  ...data,
  get: ({ plain } = {}) => (plain ? data : data),
});

describe("exportCustomerLedger API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.dbConnect.mockResolvedValue(true);
    db.sequelize.query.mockResolvedValue([{ amount: 130 }]);
  });

  it("uses payToName and partyBalance for a role-based row in the CSV export", async () => {
    db.Ledger.findAll.mockResolvedValue([
      mockRow({
        id: 1,
        paymentDate: "2026-09-01T00:00:00.000Z",
        reference: "ref-1",
        invoiceNumber: null,
        amount: 30,
        paymentType: "CASH",
        spendType: "DEBIT",
        payToCompanyId: 1,
        payToCustomerId: null,
        payByCompanyId: 2,
        payByCustomerId: null,
        payToTotal: -170,
        payByTotal: 50,
        payToCompany: { companyName: "Company A" },
        payByCompany: { companyName: "Company B" },
      }),
    ]);

    const { req, res } = createMocks({
      method: "GET",
      query: { id: "1", type: "company", fileType: "csv" },
    });

    await TenantContext.run(ORG_ID, () => exportCustomerLedger(req, res));

    expect(res.statusCode).toBe(200);
    const csv = res._getData().toString();
    expect(csv).toContain("Company A");
    expect(csv).toContain("-170.00");
  });

  it("falls back to legacy company/otherName and companyTotal for a legacy row", async () => {
    db.Ledger.findAll.mockResolvedValue([
      mockRow({
        id: 2,
        paymentDate: "2026-09-01T00:00:00.000Z",
        reference: "ref-2",
        invoiceNumber: null,
        amount: 40,
        paymentType: "CASH",
        spendType: "DEBIT",
        companyTotal: -40,
        totalBalance: -40,
        payToCompanyId: null,
        payToCustomerId: null,
        payByCompanyId: null,
        payByCustomerId: null,
        company: { companyName: "Legacy Co" },
      }),
    ]);

    const { req, res } = createMocks({
      method: "GET",
      query: { id: "1", type: "company", fileType: "csv" },
    });

    await TenantContext.run(ORG_ID, () => exportCustomerLedger(req, res));

    expect(res.statusCode).toBe(200);
    const csv = res._getData().toString();
    expect(csv).toContain("Legacy Co");
    expect(csv).toContain("-40.00");
  });

  it("puts a role-based customer CASH payment on the Credit side when the viewed customer is the Pay To party", async () => {
    // Mirrors a real row: two customers, one paying the other via the generic "Create
    // Transaction" form (paymentType CASH). The viewed customer (157) is the Pay To side, so
    // this must land in Credit — the live ledger table already gets this right via
    // resolveLedgerPartyFields; the export must not special-case CASH_LIKE ahead of it.
    db.Ledger.findAll.mockResolvedValue([
      mockRow({
        id: 3,
        paymentDate: "2026-09-08T00:00:00.000Z",
        reference: "",
        invoiceNumber: null,
        amount: 2000,
        paymentType: "CASH",
        spendType: "DEBIT",
        payToCompanyId: null,
        payByCompanyId: null,
        payToCustomerId: 157,
        payByCustomerId: 153,
        payToTotal: 15000,
        payByTotal: 2000,
        payToCustomer: { firstName: "Khalid", lastName: "Iran" },
        payByCustomer: { firstName: "Hafiz", lastName: "Hasnain" },
      }),
    ]);

    const { req, res } = createMocks({
      method: "GET",
      query: { id: "157", type: "customer", fileType: "csv" },
    });

    await TenantContext.run(ORG_ID, () => exportCustomerLedger(req, res));

    expect(res.statusCode).toBe(200);
    const csv = res._getData().toString();
    const [, dataRow] = csv.trim().split("\n");
    const [, , , debit, credit] = dataRow.split(",");
    expect(debit).toBe("");
    expect(credit).toBe("2000.00");
  });

  it("returns 404 when there are no transactions", async () => {
    db.Ledger.findAll.mockResolvedValue([]);

    const { req, res } = createMocks({
      method: "GET",
      query: { id: "1", type: "company", fileType: "csv" },
    });

    await TenantContext.run(ORG_ID, () => exportCustomerLedger(req, res));

    expect(res.statusCode).toBe(404);
  });
});
