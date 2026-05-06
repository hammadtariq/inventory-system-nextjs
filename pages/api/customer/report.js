import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import TenantContext from "@/lib/tenant-context";

const Op = db.Sequelize.Op;

export const getCustomerReport = async (req, res) => {
  const { dateRangeStart, dateRangeEnd, customerId } = req.query;

  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();

    const whereClause = {};
    whereClause.organizationId = organizationId;
    if (dateRangeStart && dateRangeEnd) {
      whereClause.createdAt = {
        [Op.between]: [new Date(dateRangeStart), new Date(`${dateRangeEnd}T23:59:59.999Z`)],
      };
    }
    if (customerId) {
      whereClause.id = customerId;
    }

    const customers = await db.Customer.findAll({
      where: whereClause,
      include: [
        {
          model: db.Sale,
          required: false,
          attributes: ["id", "totalAmount"],
          where: {
            organizationId,
          },
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const rows = customers.map((customer) => {
      const c = customer.toJSON();
      const sales = c.Sales || [];
      return {
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        email: c.email || "-",
        phone: c.phone || "-",
        address: c.address || "-",
        totalInvoices: sales.length,
        totalAmount: sales.reduce((sum, s) => sum + parseFloat(s.totalAmount || 0), 0),
      };
    });

    const grandTotal = rows.reduce((sum, r) => sum + r.totalAmount, 0);

    return res.json({ rows, total: { grandTotal, totalCustomers: rows.length } });
  } catch (error) {
    console.error("Customer report error:", error);
    return res.status(500).json({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(getCustomerReport);
