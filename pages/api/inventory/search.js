import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import TenantContext from "@/lib/tenant-context";
const Op = db.Sequelize.Op;

export const searchInventory = async (req, res) => {
  const { value } = req.query;
  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();
    const results = await db.Inventory.findAll({
      where: {
        organizationId,
        onHand: { [Op.gt]: 0 },
        [Op.or]: [{ itemName: { [Op.like]: "%" + value + "%" } }],
      },
      include: [db.Company],
    });
    return res.send(results);
  } catch (error) {
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(searchInventory);
