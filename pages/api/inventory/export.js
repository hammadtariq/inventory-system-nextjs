import nextConnect from "next-connect";
import { calculateAmount } from "@/utils/api.util";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { companyTotalBalesQuery } from "../../../query";

const path = require("path");
const fs = require("fs");
const XLSX = require("XLSX");

const exportXLS = (data, data2, filePath) => {
  /* make the worksheet */
  const ws = XLSX.utils.json_to_sheet(data);
  const ws2 = XLSX.utils.json_to_sheet(data2);
  /* add to workbook */
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet 1");
  XLSX.utils.book_append_sheet(wb, ws2, "Sheet 2");

  /* generate an XLSX file */
  // XLSX.writeFile(wb, filePath);
  XLSX.writeFile(wb, filePath);
};

const Op = db.Sequelize.Op;

const exportInventory = async (req, res) => {
  try {
    await db.dbConnect();
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

    const timestamp = new Date().getTime();
    const fileName = `inventory-${timestamp}.xlsx`;
    const filePath = path.resolve(".", "exportedFiles");

    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath);
    }
    const newPath = path.join(filePath, fileName);
    exportXLS(dataForExcel, dataForExcel2, newPath);

    const newFile = fs.readFileSync(newPath, { encoding: "base64" });

    res.setHeader("Content-disposition", `inline; filename="${fileName}"`);
    res.setHeader("Content-type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("isBase64Encoded", true);

    return res.status(200).send(newFile);
  } catch (error) {
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(exportInventory);
