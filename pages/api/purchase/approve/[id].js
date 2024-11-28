import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { SPEND_TYPE, STATUS } from "@/utils/api.util";
import { balanceQuery } from "@/utils/query.utils";

const apiSchema = Joi.object({
  id: Joi.number().required(),
});

const approvePurchaseOrder = async (req, res) => {
  console.log("Approve Purchase order Request Start");

  const { error, value } = apiSchema.validate({
    id: req.query.id,
  });

  if (error && error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }
  if (req.user.role !== "ADMIN") {
    return res.status(400).send({ message: "Operation not permitted." });
  }
  const t = await db.sequelize.transaction();
  try {
    await db.dbConnect();
    const { id } = value;
    const purchase = await db.Purchase.findByPk(id, { include: [db.Company], transaction: t });

    if (!purchase) {
      return res.status(404).send({ message: "purchase order not exist" });
    }
    if (purchase.status === STATUS.APPROVED) {
      return res.status(400).send({ message: "purchase order already approved" });
    }
    const { purchasedProducts, purchaseDate, companyId, totalAmount, invoiceNumber, revisionDetails, revisionNo } =
      purchase;

    if (!revisionNo) {
      for await (const product of purchasedProducts) {
        const { id, itemName, noOfBales, baleWeightLbs, baleWeightKgs, ratePerLbs, ratePerKgs, ratePerBale } = product;
        // TODO: testing id for this query is itemName was causing issues
        // const inventory = await db.Inventory.findOne({ where: { itemName, companyId }, transaction: t });
        const inventory = await db.Inventory.findOne({ where: { id, companyId }, transaction: t });
        if (inventory) {
          await inventory.increment(["onHand", "noOfBales"], { by: noOfBales, transaction: t });
          await inventory.increment({ baleWeightKgs: baleWeightKgs, baleWeightLbs: baleWeightLbs }, { transaction: t });
          await inventory.update(
            {
              ratePerLbs,
              ratePerKgs,
              ratePerBale,
            },
            { transaction: t }
          );
        } else {
          await db.Inventory.create(
            {
              ...product,
              companyId,
              onHand: noOfBales,
              baleWeightKgs,
              baleWeightLbs,
            },
            { transaction: t }
          );
        }
      }
    } else {
      for await (const detail of revisionDetails.purchasedProducts) {
        const { id, itemName, noOfBales, baleWeightLbs, baleWeightKgs, ratePerLbs, ratePerKgs, ratePerBale } = detail;
        // TODO: testing id for this query is itemName was causing issues
        // const inventory = await db.Inventory.findOne({ where: { itemName, companyId }, transaction: t });
        const inventory = id && (await db.Inventory.findOne({ where: { id, companyId }, transaction: t }));
        const inventoryData = inventory.toJSON();

        if (inventory) {
          if (noOfBales !== undefined) {
            await inventory.increment(["onHand", "noOfBales"], { by: noOfBales, transaction: t });
          }

          if (inventoryData.baleWeightKgs === null) {
            if (!baleWeightKgs < 0) {
              return await inventory.update({ baleWeightKgs }, { transaction: t });
            }
            // Below line will only run where it is invalid value (NaN) in Inventory else (elseIf will handle it)
            await inventory.update({ baleWeightKgs: 0 }, { transaction: t });
          } else if (baleWeightKgs !== undefined) {
            await inventory.increment({ baleWeightKgs }, { transaction: t });
          }

          if (inventoryData.baleWeightLbs === null) {
            if (!baleWeightLbs < 0) {
              return await inventory.update({ baleWeightLbs }, { transaction: t });
            }
            // Below line will only run where it is invalid value (NaN or negative) in Inventory else (elseIf will handle it)
            await inventory.update({ baleWeightLbs: 0 }, { transaction: t });
          } else if (baleWeightLbs !== undefined) {
            await inventory.increment({ baleWeightLbs }, { transaction: t });
          }

          if (ratePerLbs !== undefined && ratePerLbs !== null) {
            await inventory.update({ ratePerLbs }, { transaction: t });
          }

          if (ratePerKgs !== undefined && ratePerKgs !== null) {
            await inventory.update({ ratePerKgs }, { transaction: t });
          }

          if (ratePerBale !== undefined && ratePerBale !== null) {
            await inventory.update({ ratePerBale }, { transaction: t });
          }
        }
      }
    }
    await purchase.update({ status: STATUS.APPROVED }, { transaction: t });
    let totalBalance;
    if (revisionNo !== 0) {
      totalBalance = totalAmount;

      const ledger = await db.Ledger.findOne({
        where: { companyId, transactionId: id },
        transaction: t,
      });
      if (ledger) {
        await db.Ledger.update(
          {
            amount: totalAmount,
            spendType: SPEND_TYPE.DEBIT,
            invoiceNumber,
            paymentDate: purchaseDate,
            totalBalance: totalBalance,
          },
          {
            where: { companyId, transactionId: id },
            transaction: t,
          }
        );
      }
    } else {
      const balance = await balanceQuery(companyId, "company");
      totalBalance = balance[0].amount + totalAmount;
      await db.Ledger.create(
        {
          companyId,
          amount: totalAmount,
          transactionId: id,
          spendType: SPEND_TYPE.DEBIT,
          invoiceNumber,
          paymentDate: purchaseDate,
          totalBalance: totalBalance,
        },
        { transaction: t }
      );
    }
    await t.commit();
    console.log("Approve Purchase order Request End");
    return res.send();
  } catch (error) {
    await t.rollback();
    console.log("Approve Purchase order Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).put(approvePurchaseOrder);
