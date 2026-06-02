import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import TenantContext from "@/lib/tenant-context";
const Op = db.Sequelize.Op;

const searchItems = async (req, res) => {
  const { value } = req.query;
  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();
    const results = await db.Items.findAll({
      where: {
        organizationId,
        [Op.or]: [{ itemName: { [Op.like]: "%" + value + "%" } }],
      },
      include: [{ model: db.Company, where: { organizationId }, required: false }],
    });
    return res.send(results);
  } catch (error) {
    return res.status(500).send({ message: error.toString() });
  }
};

export { searchItems };
export default nextConnect().use(auth).get(searchItems);
