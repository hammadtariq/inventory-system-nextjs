import { companySumQuery, customerSumQuery } from "@/query/index";
import db from "@/lib/postgres";

export const balanceQuery = async (id, queryType) => {
  let rawQuery;
  try {
    if (queryType === "company") {
      rawQuery = companySumQuery(id);
    } else if (queryType === "customer") {
      rawQuery = customerSumQuery(id);
    } else {
      throw new Error("Invalid query type");
    }

    console.log("Executing query:", rawQuery); // Debugging: Check the query being executed

    const result = await db.sequelize.query(rawQuery, {
      type: db.Sequelize.QueryTypes.SELECT,
    });

    // Log the result for debugging
    console.log("Query result:", result);

    return result;
  } catch (error) {
    console.error("Error in balanceQuery:", error);
    throw error;
  }
};
