import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const calculateAmount = (totalAmount, a) => {
  if (a.ratePerKgs && a.baleWeightKgs) {
    totalAmount += Number(a.ratePerKgs * a.baleWeightKgs);
  } else if (a.ratePerLbs && a.baleWeightLbs) {
    totalAmount += Number(a.ratePerLbs * a.baleWeightLbs);
  } else if (a.noOfBales && a.ratePerBale) {
    totalAmount += Number(a.noOfBales * a.ratePerBale);
  }

  return totalAmount;
};

const getPurchaseReport = async (req, res) => {
  console.log("Get all Purchase order Request Start");
  try {
    await db.dbConnect();
    const inventory = await await db.Inventory.findAll({
      where: { onHand: { [db.Sequelize.Op.gt]: 0 } },
      include: [
        {
          model: db.Company,
          attributes: ["companyName"],
        },
      ],
      order: [["itemName", "ASC"]],
    });
    if (!inventory) {
      return res.status(404).send({ message: "inventory not exist" });
    }

    const content = inventory.reduce((acc, item) => {
      const cid = item.companyId;
      const index = acc.findIndex((e) => {
        return e.companyId === cid;
      });

      if (acc[index]) {
        acc[index].onHand += Number(item.onHand);
        acc[index].company = item.company?.companyName;
        acc[index].companyId = cid;
        acc[index].totalAmount += calculateAmount(0, item);
      } else {
        acc.push({
          company: item.company ? item.company.companyName : null,
          onHand: Number(item.onHand),
          companyId: cid,
          totalAmount: calculateAmount(0, item),
        });
      }
      return acc;
    }, []);

    let totalCost = 0;
    let totalBales = 0;
    content.forEach((item) => {
      totalCost += item.totalAmount;
      totalBales += item.onHand;
    });

    return res.json({ content, total: { totalBales, totalCost } });
  } catch (error) {
    console.log("Get all Purchase order Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};
export default nextConnect().use(auth).get(getPurchaseReport);
