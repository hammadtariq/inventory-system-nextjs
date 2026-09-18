import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import TenantContext from "@/lib/tenant-context";

export const getAvailableYears = async (req, res) => {
  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();

    const result = await db.sequelize.query(
      `SELECT DISTINCT EXTRACT(YEAR FROM "soldDate")::integer AS year
       FROM sales
       WHERE "organizationId" = :organizationId AND status = 'APPROVED'
       UNION
       SELECT DISTINCT EXTRACT(YEAR FROM "purchaseDate")::integer AS year
       FROM purchases
       WHERE "organizationId" = :organizationId AND status = 'APPROVED'
       ORDER BY year DESC`,
      { type: db.Sequelize.QueryTypes.SELECT, replacements: { organizationId } }
    );

    return res.send(result.map((r) => r.year));
  } catch (error) {
    console.error("Error retrieving available years:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

export default nextConnect().use(auth).get(getAvailableYears);
