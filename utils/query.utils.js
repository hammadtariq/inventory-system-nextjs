import { companySumQuery, customerSumQuery } from "@/query/index";
import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";
import { withTenantTransaction } from "@/lib/tenant-transaction";

export const balanceQuery = async (id, queryType, transaction) => {
  let rawQuery;
  try {
    if (queryType === "company") {
      rawQuery = companySumQuery;
    } else if (queryType === "customer") {
      rawQuery = customerSumQuery;
    } else {
      throw new Error("Invalid query type");
    }

    const organizationId = TenantContext.assertGet();
    console.log("Executing query:", rawQuery);

    const result = await db.sequelize.query(
      rawQuery,
      withTenantTransaction({
        type: db.Sequelize.QueryTypes.SELECT,
        replacements: { id, organizationId },
        ...(transaction ? { transaction } : {}),
      })
    );

    console.log("Query result:", result);

    return result;
  } catch (error) {
    console.error("Error in balanceQuery:", error);
    throw error;
  }
};
