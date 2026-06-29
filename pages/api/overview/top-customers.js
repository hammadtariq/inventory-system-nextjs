import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import TenantContext from "@/lib/tenant-context";

export const getTopCustomers = async (req, res) => {
  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const result = await db.sequelize.query(
      `SELECT CONCAT(c."firstName", ' ', c."lastName") as name,
        c."id" as "id",
        SUM(s."totalAmount") as total,
        COUNT(s.id)::integer as "salesTransactions"
      FROM sales s
      INNER JOIN customers c ON s."customerId" = c.id
      WHERE s.status = 'APPROVED'
        AND s."organizationId" = :organizationId
        AND c."organizationId" = :organizationId
        AND EXTRACT(YEAR FROM s."soldDate") = :year
      GROUP BY c.id
      ORDER BY total DESC
      LIMIT 5`,
      { type: db.Sequelize.QueryTypes.SELECT, replacements: { organizationId, year } }
    );

    return res.send(result);
  } catch (error) {
    console.error("Error retrieving top customers:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

export default nextConnect().use(auth).get(getTopCustomers);
