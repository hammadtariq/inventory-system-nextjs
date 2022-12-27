import { companySumQuery, customerSumQuery } from "query";
import db from "@/lib/postgres";

export const balanceQuery = async (id, queryType) => {
  let rawQuery;
  if (queryType === "company") {
    rawQuery = companySumQuery(id);
  } else {
    rawQuery = customerSumQuery(id);
  }
  return await db.sequelize.query(rawQuery, {
    type: db.Sequelize.QueryTypes.SELECT,
  });
};
