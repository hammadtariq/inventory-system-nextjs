import { exportHandler } from "pages/api/export/export-file";
import { companyTotalBalesQuery } from "@/query/index";
import { calculateAmount } from "@/utils/api.util";
import { auth } from "@/middlewares/auth";
import nextConnect from "next-connect";
import db from "@/lib/postgres";
import path from "path";
import fs from "fs";

const exportInventory = async (req, res) => {
  console.log("export inventory starts");
  try {
    await db.dbConnect();

    const filters = parseFilters(req.query.filters);
    const fileExtension = req.query.fileExtension;
    const [inventoryData] = await fetchInventoryData(filters);
    const formattedInventoryData = formatInventoryData(inventoryData.rows);

    const fileInfo = {
      headData: inventoryData,
      data: formattedInventoryData,
      fileName: "inventory",
      type: fileExtension,
    };

    const { headers, fileBlob } = await exportHandler(fileInfo);

    createExportDirectory();
    setResponseHeaders(res, headers);
    console.log("export inventory ends");
    return res.status(200).send(fileBlob);
  } catch (error) {
    console.error("Export Inventory Error:", error);
    return res.status(500).send({ message: error.message.toString() });
  }
};

const parseFilters = (filters) => {
  if (!filters) return [];
  try {
    return JSON.parse(filters).reduce((acc, filter) => {
      if (filter.value) {
        acc.push({ companyId: filter.value });
      }
      return acc;
    }, []);
  } catch (error) {
    console.error("Failed to parse filters:", error);
    return [];
  }
};

const fetchInventoryData = async (filters) => {
  return await Promise.all([
    db.Inventory.findAndCountAll({
      where: {
        [db.Sequelize.Op.and]: [{ onHand: { [db.Sequelize.Op.gt]: 0 } }, ...filters],
      },
      include: [db.Company],
      order: [["itemName", "ASC"]],
    }),
    db.sequelize.query(companyTotalBalesQuery, {
      type: db.Sequelize.QueryTypes.SELECT,
    }),
  ]);
};

const formatInventoryData = (rows) => {
  return rows.map((item) => ({
    itemName: item.itemName,
    companyName: item.company?.companyName ?? "N/A",
    onHand: item.onHand ?? "0",
    ratePerKgs: item.ratePerKgs ?? "N/A",
    ratePerLbs: item.ratePerLbs ?? "N/A",
    ratePerBale: item.ratePerBale ?? "N/A",
    totalBales: item.total ?? "0",
    totalAmount: calculateAmount(0, item),
  }));
};

const createExportDirectory = () => {
  const exportDir = path.resolve(".", "exportedFiles");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir);
  }
};

const setResponseHeaders = (res, headers) => {
  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
};

export default nextConnect().use(auth).get(exportInventory);
