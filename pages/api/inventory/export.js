import { exportHandler } from "pages/api/export/export-file";
import { calculateAmount } from "@/utils/api.util";
import { auth } from "@/middlewares/auth";
import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { companyTotalBalesQuery } from "@/query/index";
import path from "path";
import fs from "fs";

const exportInventory = async (req, res) => {
  try {
    await db.dbConnect();

    const { companyId, fileExtension } = req.query;

    const [inventoryData, totalBales] = await Promise.all([
      db.Inventory.findAndCountAll({
        where: { onHand: { [db.Sequelize.Op.gt]: 0 } },
        include: [db.Company],
        order: [["itemName", "ASC"]],
      }),
      db.sequelize.query(companyTotalBalesQuery, {
        type: db.Sequelize.QueryTypes.SELECT,
      }),
    ]);

    const formattedInventoryData = inventoryData.rows.map((item) => ({
      itemName: item.itemName,
      companyName: item.company?.companyName ?? "N/A",
      onHand: item.onHand ?? "0",
      ratePerKgs: item.ratePerKgs ?? "N/A",
      ratePerLbs: item.ratePerLbs ?? "N/A",
      ratePerBale: item.ratePerBale ?? "N/A",
      totalBales: item.total ?? "0",
      totalAmount: calculateAmount(0, item),
    }));

    // const formattedTotalBales = totalBales.map((entry) => ({
    //   company: entry.name ?? "N/A",
    //   totalBales: entry.total ?? "0",
    // }));

    const fileInfo = {
      headData: inventoryData,
      data: formattedInventoryData,
      fileName: "inventory",
      type: fileExtension,
    };

    const { headers, fileBlob } = await exportHandler(fileInfo);

    const filePath = path.resolve(".", "exportedFiles");
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath);
    }

    Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));

    return res.status(200).send(fileBlob);
  } catch (error) {
    console.error("Export Inventory Error:", error);
    return res.status(500).send({ message: error.message.toString() });
  }
};

export default nextConnect().use(auth).get(exportInventory);
