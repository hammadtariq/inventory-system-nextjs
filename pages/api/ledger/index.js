import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { companyQuery, customerQuery } from "../../../query";

const getAllTransactions = async (req, res) => {
  console.log("get all transaction Request Start");

  try {
    await db.dbConnect();

    const { type = "company", search = "" } = req.query;
    const baseQuery = type === "company" ? companyQuery : customerQuery;

    let finalQuery = `
      SELECT *
      FROM (
        ${baseQuery}
      ) AS t
    `;

    const replacements = {};

    if (search) {
      finalQuery += ` WHERE t.name ILIKE :search `;
      replacements.search = `%${search}%`;
    }

    finalQuery += ` ORDER BY t.total DESC;`;

    const transactions = await db.sequelize.query(finalQuery, {
      type: db.Sequelize.QueryTypes.SELECT,
      replacements,
    });

    const totalBalance = transactions.reduce((acc, obj) => acc + obj.total, 0);
    console.log("get all transaction Request End");
    return res.send({ transactions, totalBalance });
  } catch (error) {
    console.log("get all transaction Request Error:", error);
    res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(getAllTransactions);
