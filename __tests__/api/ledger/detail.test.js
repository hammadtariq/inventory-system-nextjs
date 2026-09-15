import { Op } from "sequelize";
import { createMocks } from "node-mocks-http";

import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";
import { getTransactions } from "@/pages/api/ledger/[id]";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  Ledger: { findAll: jest.fn() },
  Company: {},
  Customer: {},
  sequelize: { query: jest.fn() },
  Sequelize: { QueryTypes: { SELECT: "SELECT" } },
}));

const ORG_ID = 42;

const mockRow = (data) => ({ toJSON: () => data });

describe("getTransactions API (ledger detail)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.dbConnect.mockResolvedValue(true);
    db.sequelize.query.mockResolvedValue([{ amount: 500 }]);
  });

  it("scopes the query to legacy and role-based rows for the selected company", async () => {
    db.Ledger.findAll.mockResolvedValue([]);

    const { req, res } = createMocks({ method: "GET", query: { id: "1", type: "company" } });
    await TenantContext.run(ORG_ID, () => getTransactions(req, res));

    expect(db.Ledger.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: ORG_ID,
          [Op.or]: [{ companyId: "1" }, { payToCompanyId: "1" }, { payByCompanyId: "1" }],
        },
      })
    );
  });

  it("resolves payToName/payByName/partyBalance for a legacy row", async () => {
    db.Ledger.findAll.mockResolvedValue([
      mockRow({
        id: 1,
        amount: 100,
        paymentType: "CASH",
        spendType: "DEBIT",
        companyTotal: -100,
        totalBalance: -100,
        payToCompanyId: null,
        payToCustomerId: null,
        payByCompanyId: null,
        payByCustomerId: null,
        company: { companyName: "Acme" },
        customer: { firstName: "John", lastName: "Doe" },
      }),
    ]);

    const { req, res } = createMocks({ method: "GET", query: { id: "1", type: "company" } });
    await TenantContext.run(ORG_ID, () => getTransactions(req, res));

    const { transactions } = res._getData();
    expect(transactions[0].payToName).toBe("Acme");
    expect(transactions[0].payByName).toBe("John Doe");
    expect(transactions[0].partyBalance).toBe(-100);
  });

  it("resolves payToTotal/payByTotal for a role-based Company/Company row depending on the selected party", async () => {
    const row = {
      id: 2,
      amount: 50,
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
    };

    db.Ledger.findAll.mockResolvedValue([mockRow(row)]);

    const { req, res } = createMocks({ method: "GET", query: { id: "1", type: "company" } });
    await TenantContext.run(ORG_ID, () => getTransactions(req, res));

    const { transactions } = res._getData();
    expect(transactions[0].payToName).toBe("Company A");
    expect(transactions[0].payByName).toBe("Company B");
    // company 1 is the Pay To side, so partyBalance uses payToTotal
    expect(transactions[0].partyBalance).toBe(-170);
  });

  it("uses payByTotal when the selected company is the Pay By side", async () => {
    const row = {
      id: 3,
      amount: 50,
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
    };

    db.Ledger.findAll.mockResolvedValue([mockRow(row)]);

    const { req, res } = createMocks({ method: "GET", query: { id: "2", type: "company" } });
    await TenantContext.run(ORG_ID, () => getTransactions(req, res));

    const { transactions } = res._getData();
    expect(transactions[0].partyBalance).toBe(50);
  });
});
