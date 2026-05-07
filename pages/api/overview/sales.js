import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { saleGraphQuery } from "@/query/index";
import TenantContext from "@/lib/tenant-context";
import { withTenantTransaction } from "@/lib/tenant-transaction";

const graphSaleTable = async (req, res) => {
  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();
    const yearlyData = await db.sequelize.query(
      saleGraphQuery,
      withTenantTransaction({
        type: db.Sequelize.QueryTypes.SELECT,
        replacements: { organizationId },
      })
    );
    return res.send(yearlyData);
  } catch (error) {
    console.error("Error retrieving data:", error);
  }
};

export default nextConnect().use(auth).get(graphSaleTable);
