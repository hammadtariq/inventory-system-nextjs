import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import TenantContext from "@/lib/tenant-context";
import { withTenantTransaction } from "@/lib/tenant-transaction";

const getSalesVsPurchases = async (req, res) => {
  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();
    const queryOptions = withTenantTransaction({
      type: db.Sequelize.QueryTypes.SELECT,
      replacements: { organizationId },
    });

    const [salesData, purchasesData] = await Promise.all([
      db.sequelize.query(
        `SELECT
          TO_CHAR(TO_DATE(gs::text, 'MM'), 'Mon') as month,
          gs as month_num,
          COALESCE(SUM(s."totalAmount"), 0) as total
         FROM generate_series(1, 12) gs
         LEFT JOIN sales s
           ON EXTRACT(MONTH FROM s."soldDate") = gs
           AND EXTRACT(YEAR FROM s."soldDate") = EXTRACT(YEAR FROM NOW())
           AND s.status = 'APPROVED'
           AND s."organizationId" = :organizationId
         GROUP BY gs
         ORDER BY gs`,
        queryOptions
      ),
      db.sequelize.query(
        `SELECT
          TO_CHAR(TO_DATE(gs::text, 'MM'), 'Mon') as month,
          gs as month_num,
          COALESCE(SUM(p."totalAmount"), 0) as total
         FROM generate_series(1, 12) gs
         LEFT JOIN purchases p
           ON EXTRACT(MONTH FROM p."purchaseDate") = gs
           AND EXTRACT(YEAR FROM p."purchaseDate") = EXTRACT(YEAR FROM NOW())
           AND p.status = 'APPROVED'
           AND p."organizationId" = :organizationId
         GROUP BY gs
         ORDER BY gs`,
        queryOptions
      ),
    ]);

    return res.send({ salesData, purchasesData });
  } catch (error) {
    console.error("Error retrieving sales vs purchases:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

export default nextConnect().use(auth).get(getSalesVsPurchases);
