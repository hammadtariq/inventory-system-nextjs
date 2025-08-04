import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { STATUS, SPEND_TYPE } from "@/utils/api.util";
import { balanceQuery } from "@/utils/query.utils";

const apiSchema = Joi.object({
  id: Joi.number().required(),
});

const handler = async (req, res) => {
  console.log("Approve sale order Request Start");
  const { error, value } = apiSchema.validate({
    id: req.query.id,
  });

  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }
  if (req.user.role !== "ADMIN") {
    return res.status(400).send({ message: "Operation not permitted." });
  }
  try {
    const t = await db.sequelize.transaction();
    const { id } = value;
    const { sale, ledger, inventory } = await approveSaleOrder(id, t);

    console.log("Approve sale order Request End");
    return res.status(200).json({ success: true, sale, ledger, inventory });
  } catch (error) {
    console.log("Approve sale order Request Error:", error);
    const [code, message] = error.message.split(":");
    const status = code === "NOT_FOUND" ? 404 : code === "BAD_REQUEST" ? 400 : 500;
    return res.status(status).send({ message });
  }
};

export const approveSaleOrder = async (id, t) => {
  let updatedInventories = [];
  try {
    await db.dbConnect();

    const sale = await db.Sale.findByPk(id, { include: [db.Customer] });

    if (!sale) throw new Error("NOT_FOUND:Sale order does not exist");
    if (sale.status === STATUS.APPROVED) throw new Error("BAD_REQUEST:Sale order already approved");
    if (sale.totalAmount === 0) throw new Error("BAD_REQUEST:Sale order cannot be approved with total amount 0.");

    const { soldProducts, soldDate, customerId, totalAmount } = sale;

    for (const product of soldProducts) {
      const { id, itemName, noOfBales, companyId, baleWeightKgs, baleWeightLbs } = product;
      const inventory = await db.Inventory.findOne({
        where: {
          id,
          companyId,
          onHand: {
            [db.Sequelize.Op.or]: {
              [db.Sequelize.Op.gte]: noOfBales,
            },
          },
        },
        transaction: t,
      });
      if (!inventory) throw new Error(`NOT_FOUND:"${itemName}" is out of stock`);

      await inventory.decrement(
        {
          onHand: noOfBales,
          baleWeightKgs,
          baleWeightLbs,
        },
        { transaction: t }
      );
      await inventory.reload({ transaction: t });
      updatedInventories.push(inventory);
    }
    await sale.update({ status: STATUS.APPROVED }, { transaction: t });

    const balance = await balanceQuery(customerId, "customer");

    let totalBalance;
    if (!balance.length) {
      totalBalance = totalAmount;
    } else {
      totalBalance = balance[0].amount - totalAmount;
    }

    const ledger = await db.Ledger.create(
      {
        customerId,
        transactionId: id,
        amount: totalAmount,
        spendType: SPEND_TYPE.CREDIT,
        paymentDate: soldDate,
        invoiceNumber: id,
        totalBalance: totalBalance,
      },
      { transaction: t }
    );
    await t.commit();
    return { sale, ledger, inventory: updatedInventories };
  } catch (error) {
    await t.rollback();
    console.log("Approve sale order Error:", error);
    throw error;
  }
};

export default nextConnect().use(auth).put(handler);
