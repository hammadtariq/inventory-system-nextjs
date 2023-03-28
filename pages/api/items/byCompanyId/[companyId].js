import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const getItemListByCompanyId = async (req, res) => {
  console.log("getItemListByCompanyId Request Start");

  const { limit, offset, companyId } = req.query;
  const pagination = {};
  pagination.limit = limit ? limit : 10;
  pagination.offset = offset ? offset : 0;
  try {
    await db.dbConnect();
    const data = await db.Items.findAndCountAll({
      ...pagination,
      include: [db.Company],
      where: { companyId: companyId },
    });
    console.log("getItemListByCompanyId Request End");
    return res.send(data);
  } catch (error) {
    console.log("getItemListByCompanyId Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(getItemListByCompanyId);
