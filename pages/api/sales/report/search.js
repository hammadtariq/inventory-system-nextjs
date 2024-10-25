import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const Op = db.Sequelize.Op;

const searchSalesReport = async (req, res) => {
  const { customerId, companyId, itemName, dateRangeStart, dateRangeEnd } = req.query;

  try {
    await db.dbConnect();

    // Where clause for other conditions (like customer and date range)
    const whereClause = {
      ...(customerId && { "$customer.id$": { [Op.eq]: customerId } }),
      ...(dateRangeStart &&
        dateRangeEnd && {
          soldDate: {
            [Op.between]: [new Date(dateRangeStart), new Date(dateRangeEnd)],
          },
        }),
    };

    // Fetch sales data without filtering soldProducts at the DB level
    const data = await db.Sale.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.Customer,
          required: false,
        },
      ],
    });

    // Now filter soldProducts manually to include only matching items
    const filteredSales = data.rows
      .map((sale) => {
        // Filter products based on company and item, if provided
        const filteredProducts = sale.soldProducts.filter((product) => {
          const matchCompany = companyId ? product.companyId === +companyId : true;
          const matchItem = itemName ? product.itemName.toLowerCase().includes(itemName.toLowerCase()) : true;
          return matchCompany && matchItem;
        });

        // Return the sale with the filtered products, if there are matches
        return {
          ...sale.toJSON(), // Convert Sequelize instance to plain object
          soldProducts: filteredProducts,
        };
      })
      .filter((sale) => sale.soldProducts.length > 0); // Remove sales without matching soldProducts

    // Extract company data from filtered products
    const companyIds = new Set();

    filteredSales.forEach((sale) => {
      sale.soldProducts.forEach((product) => {
        if (product.companyId) {
          companyIds.add(Number(product.companyId));
        }
      });
    });

    if (filteredSales.length === 0) {
      return res.status(404).send({ message: "No sales data found for the given criteria." });
    }

    const companies = await db.Company.findAll({
      where: {
        id: Array.from(companyIds),
      },
    });

    const companyMap = {};
    companies.forEach((company) => {
      companyMap[company.id] = company;
    });

    filteredSales.forEach((sale) => {
      sale.soldProducts.forEach((product) => {
        product.company = companyMap[Number(product.companyId)] || null;
      });
    });

    return res.send({
      count: filteredSales.length,
      rows: filteredSales,
    });
  } catch (error) {
    return res.status(500).send({ message: error.toString() });
  }
};

// Export the API route with authentication middleware
export default nextConnect().use(auth).get(searchSalesReport);
