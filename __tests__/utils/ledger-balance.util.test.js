import { Sequelize } from "sequelize";
import { computeEntryDelta } from "@/utils/ledger-balance.util";
import { companySumQuery, customerSumQuery } from "@/query/index";

const PAYMENT_TYPES = ["REFUND", "INVENTORY_RETURN", "CASH", "ONLINE", "CHEQUE", null];
const SPEND_TYPES = ["CREDIT", "DEBIT"];

describe("computeEntryDelta", () => {
  it.each([
    // [type, paymentType, spendType, expected delta for amount 40]
    ["customer", "REFUND", "CREDIT", -40],
    ["customer", "REFUND", "DEBIT", -40],
    ["customer", "INVENTORY_RETURN", "DEBIT", 40],
    ["customer", "CASH", "DEBIT", 40],
    ["customer", "ONLINE", "DEBIT", 40],
    ["customer", "CHEQUE", "DEBIT", 40],
    ["customer", null, "DEBIT", 40],
    ["customer", null, "CREDIT", -40],
    ["customer", null, undefined, 0],
    ["company", "CASH", "DEBIT", -40],
    ["company", "ONLINE", "DEBIT", -40],
    ["company", "CHEQUE", "DEBIT", -40],
    ["company", null, "CREDIT", -40],
    ["company", null, "DEBIT", 40],
    ["company", null, undefined, 0],
  ])("%s %s %s moves the balance by %d", (type, paymentType, spendType, expected) => {
    expect(computeEntryDelta(type, paymentType, spendType, 40)).toBe(expected);
  });
});

// Runs the real Total Balance SQL against in-memory SQLite, one legacy row at a time, and
// checks it agrees with computeEntryDelta for every paymentType/spendType combination.
describe("computeEntryDelta matches the Total Balance SQL for legacy rows", () => {
  let sequelize;

  beforeAll(async () => {
    sequelize = new Sequelize({ dialect: "sqlite", storage: ":memory:", logging: false });
    await sequelize.query(`CREATE TABLE customers (id INTEGER PRIMARY KEY, "organizationId" INTEGER)`);
    await sequelize.query(`CREATE TABLE companies (id INTEGER PRIMARY KEY, "organizationId" INTEGER)`);
    await sequelize.query(`CREATE TABLE ledgers (
      id INTEGER PRIMARY KEY, "organizationId" INTEGER, amount REAL, "paymentType" TEXT, "spendType" TEXT,
      "customerId" INTEGER, "companyId" INTEGER,
      "payToCompanyId" INTEGER, "payToCustomerId" INTEGER, "payByCompanyId" INTEGER, "payByCustomerId" INTEGER)`);
    await sequelize.query(`INSERT INTO customers VALUES (5, 1)`);
    await sequelize.query(`INSERT INTO companies VALUES (9, 1)`);
  });

  afterAll(() => sequelize.close());

  beforeEach(() => sequelize.query(`DELETE FROM ledgers`));

  const sqlTotal = async (query, id) => {
    const [rows] = await sequelize.query(query, { replacements: { id, organizationId: 1 } });
    return rows.length ? Number(rows[0].amount) : 0;
  };

  const combos = PAYMENT_TYPES.flatMap((paymentType) => SPEND_TYPES.map((spendType) => [paymentType, spendType]));

  it.each(combos)("customer row %s / %s", async (paymentType, spendType) => {
    await sequelize.query(
      `INSERT INTO ledgers (id, "organizationId", amount, "paymentType", "spendType", "customerId")
       VALUES (1, 1, 40, :paymentType, :spendType, 5)`,
      { replacements: { paymentType, spendType } }
    );

    expect(await sqlTotal(customerSumQuery, 5)).toBe(computeEntryDelta("customer", paymentType, spendType, 40));
  });

  it.each(combos.filter(([paymentType]) => !["REFUND", "INVENTORY_RETURN"].includes(paymentType)))(
    "company row %s / %s",
    async (paymentType, spendType) => {
      await sequelize.query(
        `INSERT INTO ledgers (id, "organizationId", amount, "paymentType", "spendType", "companyId")
         VALUES (1, 1, 40, :paymentType, :spendType, 9)`,
        { replacements: { paymentType, spendType } }
      );

      expect(await sqlTotal(companySumQuery, 9)).toBe(computeEntryDelta("company", paymentType, spendType, 40));
    }
  );
});
