import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { companySumQuery, customerSumQuery } from "@/query/index";
import TenantContext from "@/lib/tenant-context";
import { withTenantTransaction } from "@/lib/tenant-transaction";

const CASH_LIKE_TYPES = new Set(["CASH", "ONLINE", "CHEQUE"]);

const computeEntryDelta = (type, paymentType, spendType, amount) => {
  if (type === "company") {
    if (CASH_LIKE_TYPES.has(paymentType) || spendType === "CREDIT") return -amount;
    if (spendType === "DEBIT") return amount;
    return 0;
  }
  // customer
  if (CASH_LIKE_TYPES.has(paymentType) || paymentType === "REFUND" || paymentType === "INVENTORY_RETURN") return amount;
  if (spendType === "DEBIT") return amount;
  if (spendType === "CREDIT") return -amount;
  return 0;
};

const getTransactions = async (req, res) => {
  console.log("get transaction Request Start");

  try {
    await db.dbConnect();
    const { id, type = "company" } = req.query;
    const organizationId = TenantContext.assertGet();
    const condition = type === "company" ? { companyId: id, organizationId } : { customerId: id, organizationId };

    // Fetch in ASC order so we can compute running balance chronologically
    const rows = await db.Ledger.findAll({
      where: condition,
      order: [["id", "ASC"]],
      include: [
        { model: db.Company, as: "company" },
        { model: db.Customer, as: "customer" },
      ],
    });

    // Compute running balance for each row
    let runningBalance = 0;
    const transactions = rows.map((row) => {
      const plain = row.toJSON();
      runningBalance += computeEntryDelta(type, plain.paymentType, plain.spendType, Number(plain.amount));
      return { ...plain, runningBalance };
    });

    // Reverse to DESC for display (newest first)
    transactions.reverse();

    const rawQuery = type === "company" ? companySumQuery : customerSumQuery;
    const totalBalanceResult = await db.sequelize.query(
      rawQuery,
      withTenantTransaction({
        type: db.Sequelize.QueryTypes.SELECT,
        replacements: { id, organizationId },
      })
    );
    console.log("get transaction Request End");

    return res.send({
      transactions,
      totalBalance: totalBalanceResult[0]?.amount ?? 0,
    });
  } catch (error) {
    console.log("get transaction Request Error:", error);
    res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(getTransactions);
