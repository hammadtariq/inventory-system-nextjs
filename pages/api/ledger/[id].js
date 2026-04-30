import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { companySumQuery, customerSumQuery } from "@/query/index";
import TenantContext from "@/lib/tenant-context";

const getTransactions = async (req, res) => {
  console.log("get transaction Request Start");

  try {
    await db.dbConnect();
    const { id, type = "company" } = req.query;
    const organizationId = TenantContext.assertGet();
    const condition = type === "company" ? { companyId: id, organizationId } : { customerId: id, organizationId };
    const transactions = await db.Ledger.findAll({
      where: condition,
      order: [["id", "DESC"]],
      include: [
        {
          model: db.Company,
          as: "company",
        },
        {
          model: db.Customer,
          as: "customer",
        },
      ],
    });

    const rawQuery = type === "company" ? companySumQuery : customerSumQuery;

    const totalBalance = await db.sequelize.query(rawQuery, {
      type: db.Sequelize.QueryTypes.SELECT,
      replacements: { id, organizationId },
    });
    console.log("get transaction Request End");

    return res.send({
      transactions,
      totalBalance: totalBalance[0].amount,
    });
  } catch (error) {
    console.log("get transaction Request Error:", error);
    res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(getTransactions);
