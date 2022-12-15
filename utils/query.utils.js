import Id from "pages/api/company/[id]";
import { companySumQuery, customerSumQuery } from "query";
import db from "@/lib/postgres";

export const balanceQuery = async (id, queryType) => {
  let rawQuery;
  if (queryType === "company") {
    rawQuery = companySumQuery(Id);
  } else {
    rawQuery = customerSumQuery(id);
  }
  return await db.sequelize.query(rawQuery, {
    type: db.Sequelize.QueryTypes.SELECT,
  });
};
