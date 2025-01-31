import { exportHandler } from "pages/api/export/export-file";
import { companyTotalBalesQuery } from "@/query/index";
import { calculateAmount, formatNumber } from "@/utils/api.util";
import { auth } from "@/middlewares/auth";
import nextConnect from "next-connect";
import db from "@/lib/postgres";
import path from "path";
import fs from "fs";
import { PRINT_TYPE } from "@/utils/ui.util";

const exportInventory = async (req, res) => {
  console.log("Export inventory starts");
  try {
    await db.dbConnect();

    let filters = [];
    try {
      filters = parseFilters(req.query.filters);
    } catch (error) {
      console.error("Invalid filters format:", error);
      return res.status(400).send({ message: "Invalid filters format." });
    }

    const fileExtension = req.query.fileExtension;
    const supportedExtensions = ["csv", "xlsx", "pdf"];
    if (!supportedExtensions.includes(fileExtension)) {
      return res.status(400).send({ message: "Unsupported file extension." });
    }

    const typeOf = req.query.typeOf;
    const [inventoryData] = await fetchInventoryData(filters);
    const formattedInventoryData = formatInventoryData(inventoryData.rows, typeOf);

    const fileInfo = {
      headData: inventoryData,
      data: formattedInventoryData,
      fileName: "inventory",
      type: fileExtension,
      typeOf,
    };

    const { headers, fileBlob } = await exportHandler(fileInfo);

    createExportDirectory();
    // Define file path where you want to save the file
    const filePath = path.resolve(".", "exportedFiles", `inventory.${fileExtension}`);

    // Write the file to disk (assuming fileBlob is a Buffer or stream)
    fs.writeFileSync(filePath, fileBlob);
    setResponseHeaders(res, headers);
    console.log("Export inventory ends");
    return res.status(200).send(fileBlob);
  } catch (error) {
    console.error("Export Inventory Error:", error);
    return res.status(500).send({ message: error.message.toString() });
  }
};

const parseFilters = (filters) => {
  if (!filters) return [];
  try {
    const parsedFilters = JSON.parse(filters);
    const conditions = [];

    // Iterate over each key in parsedFilters
    Object.keys(parsedFilters).forEach((key) => {
      // Remove the plural "s" if it exists (e.g., "companyIds" becomes "companyId")
      const singularKey = key.replace(/s$/, "");

      const values = parsedFilters[key];

      // Check if the values are an array
      if (Array.isArray(values)) {
        values.forEach((value) => {
          conditions.push({ [singularKey === "itemId" ? "id" : singularKey]: value });
        });
      }
    });

    return conditions;
  } catch (error) {
    console.error("Failed to parse filters:", error);
    return [];
  }
};

const fetchInventoryData = async (filters) => {
  try {
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
  } catch (error) {
    console.error("Error fetching inventory data:", error);
    throw error;
  }
};

// const formatInventoryData = (rows) => {
//   return rows.map((item) => ({
//     itemName: item.itemName || "N/A",
//     companyName: item.company?.companyName || "N/A",
//     onHand: formatNumber(item.onHand || "0"),
//     ratePerKgs: formatNumber(item.ratePerKgs || "N/A"),
//     ratePerLbs: formatNumber(item.ratePerLbs || "N/A"),
//     ratePerBale: formatNumber(item.ratePerBale || "N/A"),
//     totalBales: formatNumber(item.total || "0"),
//     ...(item.baleWeightKgs !== undefined && { kgs: formatNumber(item.baleWeightKgs) }),
//     ...(item.baleWeightLbs !== undefined && { lbs: formatNumber(item.baleWeightLbs) }),
//     ...(item.noOfBales !== undefined && { bales: formatNumber(item.noOfBales) }),
//     totalAmount: formatNumber(calculateAmount(0, item)),
//   }));
// };

const formatInventoryData = (rows, typeOf) => {
  return rows.map((item) => {
    let formattedItem = {
      itemName: item.itemName || "-",
      companyName: item.company?.companyName || "-",
      onHand: item.onHand || 0,
      totalBales: item.total || 0,
      ...(item.baleWeightKgs !== undefined && { kgs: formatNumber(item.baleWeightKgs) }),
      ...(item.baleWeightLbs !== undefined && { lbs: formatNumber(item.baleWeightLbs) }),
      ...(item.noOfBales !== undefined && { bales: item.noOfBales }),
    };

    if (typeOf === PRINT_TYPE.WITH_RATES) {
      formattedItem = {
        ...formattedItem,
        ratePerKgs: formatNumber(item.ratePerKgs || "-"),
        ratePerLbs: formatNumber(item.ratePerLbs || "-"),
        ratePerBale: formatNumber(item.ratePerBale || "-"),
        totalAmount: formatNumber(calculateAmount(0, item)),
      };
    }

    return formattedItem;
  });
};

const createExportDirectory = () => {
  try {
    const exportDir = path.resolve(".", "exportedFiles");
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
  } catch (error) {
    console.error("Failed to create export directory:", error);
    throw error;
  }
};

const setResponseHeaders = (res, headers) => {
  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
};

export default nextConnect().use(auth).get(exportInventory);
