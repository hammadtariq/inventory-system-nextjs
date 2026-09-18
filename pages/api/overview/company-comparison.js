import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import TenantContext from "@/lib/tenant-context";

export const getCompanyComparison = async (req, res) => {
  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const result = await db.sequelize.query(
      `SELECT
        comp."companyName" as name,
        COALESCE(SUM(p."totalAmount"), 0) as total
       FROM companies comp
       LEFT JOIN purchases p
         ON p."companyId" = comp.id
         AND p.status = 'APPROVED'
         AND p."organizationId" = :organizationId
         AND EXTRACT(YEAR FROM p."purchaseDate") = :year
       WHERE comp."organizationId" = :organizationId
       GROUP BY comp.id, comp."companyName"
       ORDER BY total DESC
       LIMIT 5`,
      { type: db.Sequelize.QueryTypes.SELECT, replacements: { organizationId, year } }
    );

    return res.send(result);
  } catch (error) {
    console.error("Error retrieving company comparison:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

export default nextConnect().use(auth).get(getCompanyComparison);
