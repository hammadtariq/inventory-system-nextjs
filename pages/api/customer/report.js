import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const Op = db.Sequelize.Op;

const getCustomerReport = async (req, res) => {
  const { dateRangeStart, dateRangeEnd, customerId } = req.query;

  try {
    await db.dbConnect();

    const whereClause = {};
    if (dateRangeStart && dateRangeEnd) {
      whereClause.soldDate = {
        [Op.between]: [new Date(dateRangeStart), new Date(dateRangeEnd)],
      };
    }
    if (customerId) {
      whereClause.customerId = customerId;
    }

    const sales = await db.Sale.findAll({
      where: whereClause,
      include: [{ model: db.Customer, required: false }],
    });

    // Aggregate sales by customer
    const customerMap = {};
    sales.forEach((sale) => {
      const saleData = sale.toJSON();
      const cid = saleData.customerId || "walk-in";
      const customerName = saleData.customer
        ? `${saleData.customer.firstName} ${saleData.customer.lastName}`
        : "Walk-in Customer";

      if (!customerMap[cid]) {
        customerMap[cid] = {
          id: cid,
          name: customerName,
          email: saleData.customer?.email || "-",
          phone: saleData.customer?.phone || "-",
          address: saleData.customer?.address || "-",
          totalAmount: 0,
          totalInvoices: 0,
        };
      }

      customerMap[cid].totalAmount += parseFloat(saleData.totalAmount || 0);
      customerMap[cid].totalInvoices += 1;
    });

    const rows = Object.values(customerMap).sort((a, b) => b.totalAmount - a.totalAmount);
    const grandTotal = rows.reduce((sum, r) => sum + r.totalAmount, 0);

    return res.json({ rows, total: { grandTotal, totalCustomers: rows.length } });
  } catch (error) {
    console.error("Customer report error:", error);
    return res.status(500).json({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(getCustomerReport);
