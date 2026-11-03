import nextConnect from "next-connect";
import { Op } from "sequelize";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { companySumQuery, customerSumQuery } from "@/query/index";
import { resolveLedgerPartyFields } from "@/utils/query.utils";
import { computeEntryDelta } from "@/utils/ledger-balance.util";
import TenantContext from "@/lib/tenant-context";

export const getTransactions = async (req, res) => {
  console.log("get transaction Request Start");

  try {
    await db.dbConnect();
    const { id, type = "company" } = req.query;
    const organizationId = TenantContext.assertGet();
    const condition =
      type === "company"
        ? { organizationId, [Op.or]: [{ companyId: id }, { payToCompanyId: id }, { payByCompanyId: id }] }
        : { organizationId, [Op.or]: [{ customerId: id }, { payToCustomerId: id }, { payByCustomerId: id }] };

    // Fetch in ASC order so we can compute running balance chronologically
    const rows = await db.Ledger.findAll({
      where: condition,
      order: [["id", "ASC"]],
      include: [
        { model: db.Company, as: "company" },
        { model: db.Customer, as: "customer" },
        { model: db.Company, as: "payToCompany" },
        { model: db.Customer, as: "payToCustomer" },
        { model: db.Company, as: "payByCompany" },
        { model: db.Customer, as: "payByCustomer" },
      ],
    });

    // Compute running balance for each row
    let runningBalance = 0;
    const transactions = rows.map((row) => {
      const plain = row.toJSON();
      runningBalance += computeEntryDelta(type, plain.paymentType, plain.spendType, Number(plain.amount));
      const { payToName, payByName, partyBalance, displaySpendType } = resolveLedgerPartyFields(plain, type, id);
      return { ...plain, runningBalance, payToName, payByName, partyBalance, displaySpendType };
    });

    // Reverse to DESC for display (newest first)
    transactions.reverse();

    const rawQuery = type === "company" ? companySumQuery : customerSumQuery;
    const totalBalanceResult = await db.sequelize.query(rawQuery, {
      type: db.Sequelize.QueryTypes.SELECT,
      replacements: { id, organizationId },
    });
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
