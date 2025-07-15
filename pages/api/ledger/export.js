import { exportHandler } from "pages/api/export/export-file";
import { calculateAmount } from "@/utils/api.util";
import { auth } from "@/middlewares/auth";
import nextConnect from "next-connect";
import db from "@/lib/postgres";
const path = require("path");
const fs = require("fs");

const exportLedger = async (req, res) => {
  console.log("ledger export file handler started");
  try {
    await db.dbConnect();

    // Extract query parameters
    const { fileExtension, invoiceNumber } = req.query;

    // Fetch data from the database
    const data = await db.Sale.findOne({
      where: {
        id: invoiceNumber,
      },
      include: [
        {
          model: db.Customer,
          attributes: ["id", "firstName", "lastName", "email", "phone", "address"],
        },
      ],
      order: [["updatedAt", "DESC"]],
    });

    if (!data) throw new Error("Sale not found");

    const soldProducts = data.soldProducts || [];

    // ✅ Step 1: Extract unique companyIds
    const companyIds = [...new Set(soldProducts.map((item) => item.companyId).filter(Boolean))];

    // ✅ Step 2: Fetch all related companies in one go
    const companies = await db.Company.findAll({
      where: { id: companyIds },
      attributes: ["id", "companyName"],
    });

    // ✅ Step 3: Create a map of companies by ID
    const companyMap = {};
    companies.forEach((company) => {
      companyMap[company.id] = company.companyName;
    });

    // ✅ Step 4: Map the sale data
    const dataForExcel = soldProducts.map((element) => ({
      itemDetail: element.itemName,
      kgs: element.baleWeightKgs ?? "-",
      lbs: element.baleWeightLbs ?? "-",
      bales: element.noOfBales ?? "-",
      kgRate: element.ratePerKgs ?? "-",
      lbsRate: element.ratePerLbs ?? "-",
      baleRate: element.ratePerBale ?? "-",
      totalAmount: calculateAmount(0, element),
      company: { companyName: companyMap[element.companyId] || "-" }, // ✅ Final addition
    }));

    // Update req.body with the prepared data
    const fileInfo = {
      headData: data,
      data: dataForExcel,
      fileName: "ledger",
      type: fileExtension,
    };
    // Call export handler with the prepared data
    const response = await exportHandler(fileInfo);
    const { headers, fileBlob } = response;

    // Ensure the directory exists
    const filePath = path.resolve(".", "exportedFiles");
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath);
    }

    // Generate the path for the new file
    const newPath = path.join(filePath, `${fileInfo.fileName}.${fileInfo.type}`);
    fs.writeFileSync(newPath, fileBlob);

    // Set the headers
    for (const [key, value] of Object.entries(headers)) {
      res.setHeader(key, value);
    }

    res.status(200).send(fileBlob);
    console.log("ledger export file handler ended");
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error.message });
  }
};

export default nextConnect().use(auth).get(exportLedger);
