import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const getPurchaseNameByCompanyId = async (req, res) => {
  console.log("getPurchaseNameByCompanyId Request Start");

  const { limit, offset, companyId } = req.query;
  const pagination = {};
  pagination.limit = limit ? limit : 10;
  pagination.offset = offset ? offset : 0;
  try {
    await db.dbConnect();
    const data = await db.Purchase.findAndCountAll({
      ...pagination,
      include: [db.Company],
      where: { companyId: companyId },
    });
    console.log("getPurchaseNameByCompanyId Request End");
    return res.send(data);
  } catch (error) {
    console.log("getPurchaseNameByCompanyId Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(getPurchaseNameByCompanyId);
