import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import TenantContext from "@/lib/tenant-context";

const graphTablesCount = async (req, res) => {
  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();
    const queryOptions = {
      type: db.Sequelize.QueryTypes.SELECT,
      replacements: { organizationId },
    };
    const customerCount = await db.sequelize.query(
      `SELECT COUNT(*) FROM customers WHERE "organizationId" = :organizationId`,
      queryOptions
    );
    const companyCount = await db.sequelize.query(
      `SELECT COUNT(*) FROM companies WHERE "organizationId" = :organizationId`,
      queryOptions
    );
    const inventoryCount = await db.sequelize.query(
      `SELECT COUNT(*) FROM inventories WHERE "organizationId" = :organizationId`,
      queryOptions
    );
    const chequeCount = await db.sequelize.query(
      `SELECT COUNT(*) FROM cheques WHERE "organizationId" = :organizationId`,
      queryOptions
    );

    const counts = {
      customers: customerCount[0].count,
      companies: companyCount[0].count,
      inventory: inventoryCount[0].count,
      cheques: chequeCount[0].count,
    };
    res.send(counts);
  } catch (error) {
    console.error("Error retrieving counts:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

export default nextConnect().use(auth).get(graphTablesCount);
