import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import TenantContext from "@/lib/tenant-context";
const Op = db.Sequelize.Op;

const searchCompany = async (req, res) => {
  const { value } = req.query;
  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();
    const results = await db.Company.findAll({
      where: {
        organizationId,
        [Op.or]: [{ companyName: { [Op.like]: "%" + value + "%" } }],
      },
    });
    return res.send(results);
  } catch (error) {
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(searchCompany);
