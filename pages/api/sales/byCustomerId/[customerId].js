import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { DEFAULT_ROWS_LIMIT } from "@/utils/api.util";
import TenantContext from "@/lib/tenant-context";

const getCustomerNamebyCustomerId = async (req, res) => {
  console.log("getCustomerNamebyCustomerId Request Start");

  const { limit, offset, customerId } = req.query;
  const pagination = {};
  pagination.limit = limit ? Number(limit) : DEFAULT_ROWS_LIMIT;
  pagination.offset = offset ? offset : 0;
  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();
    const data = await db.Sale.findAndCountAll({
      ...pagination,
      include: [{ model: db.Customer, where: { organizationId }, required: false }],
      where: { customerId, organizationId },
      order: [["id", "DESC"]],
    });
    console.log("getCustomerNamebyCustomerId Request End");
    return res.send(data);
  } catch (error) {
    console.log("getCustomerNamebyCustomerId Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(getCustomerNamebyCustomerId);
