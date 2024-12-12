import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { cleanItemName } from "@/utils/api.util";

const Op = db.Sequelize.Op;

const searchPurchaseReport = async (req, res) => {
  const { companyId, itemName, dateRangeStart, dateRangeEnd } = req.query;

  try {
    await db.dbConnect();

    // Build the `where` clause for the purchase query
    const whereClause = {};
    if (dateRangeStart && dateRangeEnd) {
      whereClause.purchaseDate = {
        [Op.between]: [new Date(dateRangeStart), new Date(dateRangeEnd)],
      };
    }

    // Fetch purchases and include associated company data
    const purchases = await db.Purchase.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.Company,
          required: false, // Include even if no associated company
        },
      ],
    });

    if (!purchases.rows.length) {
      return res.status(404).json({ message: "No purchases found for the given criteria." });
    }

    // Filter purchases based on companyId and itemName
    const cleanedItemName = cleanItemName(itemName);
    const filteredPurchases = purchases.rows
      .map((purchase) => {
        const matchesCompany = companyId ? purchase.company?.id === +companyId : true;
        const filteredProducts = purchase.purchasedProducts.filter((product) => {
          const matchesItemName = cleanedItemName
            ? product.itemName.toLowerCase().includes(cleanedItemName.toLowerCase())
            : true;
          return matchesCompany && matchesItemName;
        });

        return filteredProducts.length ? { ...purchase.toJSON(), purchasedProducts: filteredProducts } : null;
      })
      .filter(Boolean);

    if (!filteredPurchases.length) {
      return res.status(404).json({ message: "No purchases match the filtered criteria." });
    }

    // Extract unique company IDs from the filtered purchases
    const companyIds = new Set();
    filteredPurchases.forEach((purchase) => {
      if (purchase.company?.id) {
        companyIds.add(Number(purchase.company.id));
      }
    });

    // Fetch companies based on the extracted company IDs
    const companies = await db.Company.findAll({
      where: {
        id: Array.from(companyIds),
      },
    });

    // Map companies to their respective IDs
    const companyMap = {};
    companies.forEach((company) => {
      companyMap[company.id] = company;
    });

    // Map company data to products
    filteredPurchases.forEach((purchase) => {
      purchase.purchasedProducts.forEach((product) => {
        product.company = companyMap[Number(product.companyId)] || null;
      });
    });

    // Return the filtered purchases with company information
    return res.status(200).json({
      count: filteredPurchases.length,
      rows: filteredPurchases,
    });
  } catch (error) {
    console.error("Error fetching purchase report:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Export the API route with authentication middleware
export default nextConnect().use(auth).get(searchPurchaseReport);
