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

    // Check status for editability
    if (!EDITABLE_STATUS.includes(purchaseObj.status)) {
      console.warn(`Purchase order is: ${purchaseObj.status}).`);

      // Calculate differences
      const differences = calculateDifferences(value, purchaseObj);

      // Log only if there are differences
      if (Object.keys(differences).length) {
        console.log("Differences Detected:", JSON.stringify(differences, null, 2));
      }

      // Update the purchase order with the new data and increment the revision number
      console.log("Updating Purchase Order with new values...");
      await purchase.update({
        ...value,
        status: STATUS.PENDING,
        revisionDetails: differences,
        revisionNo: (purchaseObj?.revisionNo ?? 0) + 1,
      });

      console.log("===== Update Purchase Order Request End =====");
      return res.send(purchase);
    } else {
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
        return res.send(purchase);
      }

      // Calculate differences if revision exists
      const newDifferences = calculateDifferences(value, purchaseObj);

      // Update the purchase order with new values and increment revision
      await purchase.update({
        ...value,
        status: STATUS.PENDING,
        revisionDetails: newDifferences,
        revisionNo: previousRevisionNo + 1,
      });

      console.log("===== Update Purchase Order Request End =====");
      return res.send(purchase);
    }
  } catch (error) {
    console.error("Update Purchase Order Request Error:");
    console.error(error.stack || error.toString());
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(getPurchaseOrder).put(updatePurchaseOrder);
