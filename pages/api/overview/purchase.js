import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { purchaseGraphQuery } from "@/query/index";
import TenantContext from "@/lib/tenant-context";

const graphPurchaseTable = async (req, res) => {
  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();
    const yearlyData = await db.sequelize.query(purchaseGraphQuery, {
      type: db.Sequelize.QueryTypes.SELECT,
      replacements: { organizationId },
    });
    return res.send(yearlyData);
  } catch (error) {
    console.error("Error retrieving data:", error);
  }
};

export default nextConnect().use(auth).get(graphPurchaseTable);
