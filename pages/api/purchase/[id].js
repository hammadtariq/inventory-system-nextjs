import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { STATUS, EDITABLE_STATUS } from "@/utils/api.util";
import { calculateDifferences } from "@/utils/calculateDifferences.util";

const inventorySchema = Joi.object().keys({
  itemName: Joi.string().min(3).trim().lowercase(),
  noOfBales: Joi.number(),
  baleWeightLbs: Joi.number().allow(null),
  baleWeightKgs: Joi.number().allow(null),
  ratePerLbs: Joi.number().allow(null),
  ratePerKgs: Joi.number().allow(null),
  ratePerBale: Joi.number().allow(null),
  id: Joi.number().required(),
});
const apiSchema = Joi.object({
  companyId: Joi.number(),
  totalAmount: Joi.number(),
  surCharge: Joi.number().allow(null),
  invoiceNumber: Joi.string().trim().allow(null),
  purchaseDate: Joi.date(),
  purchasedProducts: Joi.array().items(inventorySchema),
  baleType: Joi.string().valid("SMALL_BALES", "BIG_BALES"),
  id: Joi.number().required(),
});

const getPurchaseOrder = async (req, res) => {
  console.log("Get Purchase order Request Start");
  const { error, value } = apiSchema.validate({
    id: req.query.id,
  });

  if (error && error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }
  try {
    await db.dbConnect();
    const { id } = value;
    const purchase = await db.Purchase.findByPk(id, { include: [db.Company] });

    if (!purchase) {
      return res.status(404).send({ message: "purchase order not exist" });
    }
    console.log("Get Purchase order Request End");

    return res.send(purchase);
  } catch (error) {
    console.log("Get Purchase order Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

const updatePurchaseOrder = async (req, res) => {
  console.log("===== Update Purchase Order Request Start =====");

  // Validate the incoming request
  const { error, value } = apiSchema.validate({
    ...req.body,
    id: req.query.id,
  });

  if (error && Object.keys(error).length) {
    console.error("Validation Error:", JSON.stringify(error.details || error, null, 2));
    return res.status(400).send({ message: error.toString() });
  }

  try {
    // Establish database connection
    await db.dbConnect();

    // Find the purchase order by ID
    const { id } = value;
    const purchase = await db.Purchase.findByPk(id);

    if (!purchase) {
      console.error(`Purchase Order with ID ${id} does not exist.`);
      return res.status(404).send({ message: "Purchase order does not exist" });
    }

    const purchaseObj = purchase.toJSON();

    // Log minimal purchase details for tracking
    console.log(`Purchase Order ${id} found with status: ${purchaseObj.status}`);

    const clonePurchase = value;
    delete clonePurchase.id;
    const newRevisionNo = (purchaseObj.revisionNo || 0) + 1;

    // Check status for editing
    if (!EDITABLE_STATUS.includes(purchaseObj.status)) {
      console.warn(`Purchase order is: ${purchaseObj.status}`);
      const updatedPurchase = await updatePurchaseOrderAfterApproval(
        value,
        purchase,
        purchaseObj,
        clonePurchase,
        newRevisionNo
      );
      console.log("===== Update Purchase Order Request End =====");
      return res.send(updatedPurchase);
    }

    console.log("Purchase Order is editable, proceeding with the update...");
    /**
        @returns {number} The previous revision number Track the update for revisions
        If the purchase is not approved yet, so the revision number will be 0.
        If the purchase was approved before, use the existing revision number.
      */
    const previousRevisionNo = purchaseObj?.revisionNo ?? 0;
    if (!previousRevisionNo) {
      console.log("===== Update Purchase Order Request End =====");
      await purchase.update({ ...value, status: STATUS.PENDING });
    }
    return res.send(purchase);
  } catch (error) {
    console.error("Update Purchase Order Request Error:", error.stack || error.toString());
    return res.status(500).send({ message: error.toString() });
  }
};

const updatePurchaseOrderAfterApproval = async (value, purchase, purchaseObj, clonePurchase, newRevisionNo) => {
  // Calculate differences
  const differences = calculateDifferences(value, purchaseObj);

  if (Object.keys(differences).length) {
    console.log("Differences Detected:", JSON.stringify(differences, null, 2));
  }

  await createPurchaseHistory({
    purchaseId: purchase.id,
    clonePurchase,
    revisionDetails: differences,
    revisionNo: newRevisionNo,
    previousPurchasedProducts: purchaseObj.purchasedProducts,
  });

  // Update the purchase order
  console.log("Updating Purchase Order with revision after approval...");
  await purchase.update({
    ...value,
    status: STATUS.PENDING,
    revisionDetails: differences,
    revisionNo: newRevisionNo,
  });
  return purchase;
};

const createPurchaseHistory = async ({
  purchaseId,
  clonePurchase,
  revisionDetails,
  revisionNo,
  previousPurchasedProducts,
}) => {
  revisionDetails.previousPurchasedProducts = previousPurchasedProducts;
  return await db.PurchaseHistory.create({
    ...clonePurchase,
    purchaseId,
    revisionNo,
    revisionDetails,
    createdAt: new Date(),
  });
};

export { updatePurchaseOrder, updatePurchaseOrderAfterApproval };
export default nextConnect().use(auth).get(getPurchaseOrder).put(updatePurchaseOrder);
