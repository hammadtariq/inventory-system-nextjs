import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { createLedgerPayment } from "@/lib/ledger";
import { auth } from "@/middlewares/auth";
import { PAYMENT_TYPE, SPEND_TYPE, STATUS } from "@/utils/api.util";
import { getReturnedQuantityMap, getSaleReturnItemKey } from "@/utils/saleReturn.util";

const productSchema = Joi.object().keys({
  itemName: Joi.string().trim().required(),
  noOfBales: Joi.number().min(0).required(),
  baleWeightLbs: Joi.number().allow(null),
  baleWeightKgs: Joi.number().allow(null),
  ratePerLbs: Joi.number().allow(null),
  ratePerKgs: Joi.number().allow(null),
  ratePerBale: Joi.number().allow(null),
  companyId: Joi.number().required(),
  id: Joi.number().required(),
});

const apiSchema = Joi.object({
  saleId: Joi.number().required(),
  customerId: Joi.number().required(),
  totalAmount: Joi.number().min(0).required(),
  returnDate: Joi.date().required(),
  reference: Joi.string().trim().allow(""),
  returnedProducts: Joi.array().items(productSchema).min(1).required(),
});

const updateInventoryForReturn = async (products, transaction) => {
  const updatedInventory = [];

  for (const product of products) {
    const { companyId, id, noOfBales, baleWeightKgs, baleWeightLbs, ratePerLbs, ratePerKgs, ratePerBale, itemName } =
      product;

    let inventory = await db.Inventory.findOne({
      where: { id, companyId },
      transaction,
    });

    if (inventory) {
      await inventory.increment({ onHand: noOfBales || 0, noOfBales: noOfBales || 0 }, { transaction });

      if (baleWeightKgs !== undefined && baleWeightKgs !== null) {
        if (inventory.baleWeightKgs === null) {
          await inventory.update({ baleWeightKgs: baleWeightKgs >= 0 ? baleWeightKgs : 0 }, { transaction });
        } else {
          await inventory.increment({ baleWeightKgs }, { transaction });
        }
      }

      if (baleWeightLbs !== undefined && baleWeightLbs !== null) {
        if (inventory.baleWeightLbs === null) {
          await inventory.update({ baleWeightLbs: baleWeightLbs >= 0 ? baleWeightLbs : 0 }, { transaction });
        } else {
          await inventory.increment({ baleWeightLbs }, { transaction });
        }
      }

      await inventory.update(
        {
          ratePerLbs: ratePerLbs || inventory.ratePerLbs,
          ratePerKgs: ratePerKgs || inventory.ratePerKgs,
          ratePerBale: ratePerBale || inventory.ratePerBale,
          itemName: itemName || inventory.itemName,
        },
        { transaction }
      );
      await inventory.reload({ transaction });
    } else {
      inventory = await db.Inventory.create(
        {
          ...product,
          onHand: noOfBales || 0,
          noOfBales: noOfBales || 0,
          baleWeightKgs: baleWeightKgs ?? null,
          baleWeightLbs: baleWeightLbs ?? null,
        },
        { transaction }
      );
    }

    updatedInventory.push(inventory);
  }

  return updatedInventory;
};

const createSaleReturn = async (req, res) => {
  console.log("Create sale return Request Start");
  let transaction;

  const { error, value } = apiSchema.validate(req.body);
  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }

  if (req.user.role !== "ADMIN") {
    return res.status(400).send({ message: "Operation not permitted." });
  }

  try {
    await db.dbConnect();
    transaction = await db.sequelize.transaction();

    const { saleId, customerId, totalAmount, returnDate, reference, returnedProducts } = value;

    const sale = await db.Sale.findByPk(saleId, {
      include: [db.Customer],
      transaction,
    });

    if (!sale) {
      throw new Error("NOT_FOUND:Sale order does not exist");
    }

    if (sale.status !== STATUS.APPROVED) {
      throw new Error("BAD_REQUEST:Only approved sales can be returned");
    }

    if (sale.customerId !== customerId) {
      throw new Error("BAD_REQUEST:Selected customer does not match sale");
    }

    const priorReturns = await db.SaleReturn.findAll({
      where: { saleId },
      transaction,
    });

    const returnedQuantityMap = getReturnedQuantityMap(priorReturns);

    for (const product of returnedProducts) {
      const originalProduct = (sale.soldProducts || []).find(
        (soldProduct) => soldProduct.id === product.id && soldProduct.companyId === product.companyId
      );

      if (!originalProduct) {
        throw new Error(`BAD_REQUEST:${product.itemName} does not belong to this sale`);
      }

      const key = getSaleReturnItemKey(product);
      const soldQuantity = Number(originalProduct.noOfBales || 0);
      const alreadyReturned = Number(returnedQuantityMap[key] || 0);
      const remainingQuantity = soldQuantity - alreadyReturned;
      const requestedQuantity = Number(product.noOfBales || 0);

      if (requestedQuantity <= 0) {
        throw new Error(`BAD_REQUEST:${product.itemName} return quantity must be greater than 0`);
      }

      if (requestedQuantity > remainingQuantity) {
        throw new Error(`BAD_REQUEST:${product.itemName} return quantity cannot exceed ${remainingQuantity}`);
      }
    }

    const updatedInventory = await updateInventoryForReturn(returnedProducts, transaction);

    const ledger = await createLedgerPayment(
      {
        customerId,
        totalAmount,
        reference,
        spendType: SPEND_TYPE.DEBIT,
        paymentDate: returnDate,
        paymentType: PAYMENT_TYPE.CASH,
      },
      transaction
    );

    const saleReturn = await db.SaleReturn.create(
      {
        saleId,
        customerId,
        totalAmount,
        returnedProducts,
        reference,
        returnDate,
        ledgerId: ledger.id,
      },
      { transaction }
    );

    await transaction.commit();

    console.log("Create sale return Request End");
    return res.status(200).json({
      success: true,
      saleReturn,
      ledger,
      inventory: updatedInventory,
    });
  } catch (err) {
    if (transaction) {
      await transaction.rollback();
    }
    console.log("Create sale return Request Error:", err);

    const [code, message] = err.message.split(":");
    const status = code === "NOT_FOUND" ? 404 : code === "BAD_REQUEST" ? 400 : 500;
    return res.status(status).send({ message });
  }
};

export default nextConnect().use(auth).post(createSaleReturn);
