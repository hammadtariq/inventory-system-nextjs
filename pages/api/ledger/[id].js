import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { companySumQuery, customerSumQuery } from "../../../query";

const getTransactions = async (req, res) => {
  console.log("get transaction Request Start");

  try {
    await db.dbConnect();
    const { id, type = "company" } = req.query;
    const condition = type === "company" ? { companyId: id } : { customerId: id };
    const transactions = await db.Ledger.findAll({
      where: condition,
      order: [["paymentDate", "DESC"]],
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

    const rawQuery = type === "company" ? companySumQuery(id) : customerSumQuery(id);

    const totalBalance = await db.sequelize.query(rawQuery, {
      type: db.Sequelize.QueryTypes.SELECT,
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
