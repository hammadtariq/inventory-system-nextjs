const path = require("path");
const fs = require("fs");
const XLSX = require("XLSX");

const exportXLS = (data, filePath) => {
  /* make the worksheet */
  const ws = XLSX.utils.json_to_sheet(data);
  /* add to workbook */
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet 1");
  /* generate an XLSX file */
  // XLSX.writeFile(wb, filePath);
  XLSX.writeFile(wb, filePath);
};

import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
const Op = db.Sequelize.Op;

const exportInventry = async (req, res) => {
  try {
    await db.dbConnect();
    const data = await db.Inventory.findAndCountAll();

    const dataForExcel = data.rows.map((el) => el.dataValues);

    // const fileName = HELPER_TEXT_EXPORT_FILENAME || "helperText.xlsx";
    const fileName = "helperText.xlsx";
    // console.log("HelperText export filename", fileName);

    // const filePath = EXPORT_FILEPATH || path.join(global.appRoot, "exports");
    global.appRoot = path.resolve(__dirname);
    // console.log('====>', global.appRoot);
    const filePath = path.join(global.appRoot, "excelData");
    // console.log("HelperText export filepath", filePath);

    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath);
    }
    const newPath = path.join(filePath, fileName);
    // const [err, helperTexts] = await to(HelperText.scan().all().exec());

    // if (err) return badRes(res, err);

    exportXLS(dataForExcel, newPath);
    // exportXLS(dataForExcel, 'sampleData.export.xlsx');

    const newFile = fs.readFileSync(newPath, { encoding: "base64" });

    res.setHeader("Content-disposition", `inline; filename="${fileName}"`);
    res.setHeader("Content-type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("isBase64Encoded", true);

    return res.status(200).send(newFile);
  } catch (error) {
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(exportInventry);

// exports.export = async (req, res) => {
//     console.log(req);
//     console.log("HelperText export started");
//     console.time("HelperTextExport");

//     const fileName = HELPER_TEXT_EXPORT_FILENAME || "helperText.xlsx";
//     console.log("HelperText export filename", fileName);

//     const filePath = EXPORT_FILEPATH || path.join(global.appRoot, "exports");
//     console.log("HelperText export filepath", filePath);

//     if (!fs.existsSync(filePath)) {
//         fs.mkdirSync(filePath);
//     }
//     const newPath = path.join(filePath, fileName);
//     const [err, helperTexts] = await to(HelperText.scan().all().exec());

//     if (err) return badRes(res, err);

//     exportXLS(helperTexts, newPath);
//     console.log("HelperText export newPath", newPath);
//     console.log("HelperText export ended");
//     console.timeEnd("HelperTextExport");

//     res.setHeader("Content-disposition", `inline; filename="${fileName}"`);
//     res.setHeader("Content-type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
//     res.setHeader("isBase64Encoded", true);

//     const newFile = fs.readFileSync(newPath, { encoding: "base64" });
//     return res.status(200).send(newFile);
//     // return res.send("results");
// };
