import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import TenantContext from "@/lib/tenant-context";

const getTopProducts = async (req, res) => {
  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();

    const result = await db.sequelize.query(
      `SELECT
        product->>'itemName' as name,
        SUM((product->>'noOfBales')::numeric) as "totalBales"
       FROM sales,
         jsonb_array_elements("soldProducts") as product
       WHERE status = 'APPROVED'
       AND "organizationId" = :organizationId
       GROUP BY product->>'itemName'
       ORDER BY "totalBales" DESC
       LIMIT 5`,
      { type: db.Sequelize.QueryTypes.SELECT, replacements: { organizationId } }
    );

    return res.send(result);
  } catch (error) {
    console.error("Error retrieving top products:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

export default nextConnect().use(auth).get(getTopProducts);
