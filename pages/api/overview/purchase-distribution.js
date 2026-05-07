import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import TenantContext from "@/lib/tenant-context";
import { withTenantTransaction } from "@/lib/tenant-transaction";

const getPurchaseDistribution = async (req, res) => {
  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();
    const queryOptions = withTenantTransaction({
      type: db.Sequelize.QueryTypes.SELECT,
      replacements: { organizationId },
    });

    const [paidResult, totalResult] = await Promise.all([
      db.sequelize.query(
        `SELECT COALESCE(SUM(amount), 0) as total
         FROM ledgers
         WHERE "companyId" IS NOT NULL
           AND "organizationId" = :organizationId
           AND "paymentType" IN ('CASH', 'ONLINE', 'CHEQUE')`,
        queryOptions
      ),
      db.sequelize.query(
        `SELECT COALESCE(SUM("totalAmount"), 0) as total
         FROM purchases
         WHERE status = 'APPROVED' AND "organizationId" = :organizationId`,
        queryOptions
      ),
    ]);

    const paid = parseFloat(paidResult[0].total) || 0;
    const total = parseFloat(totalResult[0].total) || 0;
    const remaining = Math.max(total - paid, 0);

    return res.send({ paid, remaining, total });
  } catch (error) {
    console.error("Error retrieving purchase distribution:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

export default nextConnect().use(auth).get(getPurchaseDistribution);
