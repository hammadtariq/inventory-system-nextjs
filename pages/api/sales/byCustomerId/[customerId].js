import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const getCustomerNamebyCustomerId = async (req, res) => {
  console.log("getCustomerNamebyCustomerId Request Start");

  const { limit, offset, customerId } = req.query;
  const pagination = {};
  pagination.limit = limit ? limit : 10;
  pagination.offset = offset ? offset : 0;
  try {
    await db.dbConnect();
    const data = await db.Sale.findAndCountAll({
      ...pagination,
      include: [db.Customer],
      where: { customerId },
    });
    console.log("getCustomerNamebyCustomerId Request End");
    return res.send(data);
  } catch (error) {
    console.log("getCustomerNamebyCustomerId Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(getCustomerNamebyCustomerId);
