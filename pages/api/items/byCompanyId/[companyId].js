import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import TenantContext from "@/lib/tenant-context";

const getItemListByCompanyId = async (req, res) => {
  console.log("getItemListByCompanyId Request Start");

  const { limit, offset, companyId } = req.query;
  const pagination = {};
  pagination.limit = limit ? limit : 10;
  pagination.offset = offset ? offset : 0;
  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();
    const data = await db.Items.findAndCountAll({
      ...pagination,
      include: [{ model: db.Company, where: { organizationId }, required: false }],
      where: { companyId, organizationId },
    });
    console.log("getItemListByCompanyId Request End");
    return res.send(data);
  } catch (error) {
    console.log("getItemListByCompanyId Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(getItemListByCompanyId);
