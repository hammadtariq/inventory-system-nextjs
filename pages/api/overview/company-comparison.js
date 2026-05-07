import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const getCompanyComparison = async (req, res) => {
  try {
    await db.dbConnect();

    const result = await db.sequelize.query(
      `SELECT
        comp."companyName" as name,
        COALESCE(SUM(p."totalAmount"), 0) as total
       FROM companies comp
       LEFT JOIN purchases p
         ON p."companyId" = comp.id AND p.status = 'APPROVED'
       GROUP BY comp.id, comp."companyName"
       ORDER BY total DESC
       LIMIT 5`,
      { type: db.Sequelize.QueryTypes.SELECT }
    );

    return res.send(result);
  } catch (error) {
    console.error("Error retrieving company comparison:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

export default nextConnect().use(auth).get(getCompanyComparison);
