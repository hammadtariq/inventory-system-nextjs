import { exportHandler } from "pages/api/export/export-file";
import { calculateAmount } from "@/utils/api.util";
import { auth } from "@/middlewares/auth";
import nextConnect from "next-connect";
import db from "@/lib/postgres";
const path = require("path");
const fs = require("fs");

const exportInventory = async (req, res) => {
  console.log("inventory export file handler started");
  try {
    await db.dbConnect();

    // Extract query parameters
    const { companyId, fileExtension } = req.query;

    // Fetch data from the database
    const data = await db.Inventory.findAndCountAll({
      where: { onHand: { [db.Sequelize.Op.gt]: 0 } },
      include: [db.Company],
      order: [["itemName", "ASC"]],
    });

    await db.dbConnect();
    const totalBales = await db.sequelize.query(companyTotalBalesQuery, {
      type: db.Sequelize.QueryTypes.SELECT,
    });

    const dataForExcel = data.rows.map((element) => ({
      itemName: element.itemName,
      companyName: element.company?.companyName ?? "N/A",
      onHand: element.onHand ?? "0",
      ratePerKgs: element.ratePerKgs ?? "N/A",
      ratePerLbs: element.ratePerLbs ?? "N/A",
      ratePerBale: element.ratePerBale ?? "N/A",
      totalAmount: calculateAmount(0, element),
    }));
    const dataForExcel2 = totalBales.map((d) => ({
      company: d.name ?? "N/A",
      totalBales: d.total ?? "0",
    }));

    // Update req.body with the prepared data
    const fileInfo = {
      data: dataForExcel,
      fileName: "inventory",
      type: fileExtension,
    };
    // Call export handler with the prepared data
    const response = await exportHandler(fileInfo);

    // Ensure the directory exists
    const filePath = path.resolve(".", "exportedFiles");
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath);
    }
    // Set the headers
    const { headers, fileBlob } = response;
    for (const [key, value] of Object.entries(headers)) {
      res.setHeader(key, value);
    }

    console.log("inventory export file handler ended");
    return res.status(200).send(fileBlob);
  } catch (error) {
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(exportInventory);
