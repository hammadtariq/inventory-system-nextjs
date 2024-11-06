import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const graphTablesCount = async (req, res) => {
  try {
    await db.dbConnect();
    const customerCount = await db.sequelize.query("SELECT COUNT(*) FROM customers", {
      type: db.Sequelize.QueryTypes.SELECT,
    });
    const companyCount = await db.sequelize.query("SELECT COUNT(*) FROM companies", {
      type: db.Sequelize.QueryTypes.SELECT,
    });
    const inventoryCount = await db.sequelize.query("SELECT COUNT(*) FROM inventories", {
      type: db.Sequelize.QueryTypes.SELECT,
    });
    const chequeCount = await db.sequelize.query("SELECT COUNT(*) FROM cheques", {
      type: db.Sequelize.QueryTypes.SELECT,
    });

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
