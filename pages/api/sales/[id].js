import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { EDITABLE_STATUS, STATUS } from "@/utils/api.util";
import TenantContext from "@/lib/tenant-context";
import { pickDefinedFields } from "@/lib/request-fields";

const updateFields = ["customerId", "totalAmount", "laborCharge", "soldDate", "soldProducts"];

const inventorySchema = Joi.object().keys({
  itemName: Joi.string().min(3).trim().lowercase(),
  noOfBales: Joi.number().allow(null),
  baleWeightLbs: Joi.number().allow(null),
  baleWeightKgs: Joi.number().allow(null),
  ratePerLbs: Joi.number().allow(null),
  ratePerKgs: Joi.number().allow(null),
  ratePerBale: Joi.number().allow(null),
  onHand: Joi.number(),
  companyId: Joi.number(),
  id: Joi.number().required(),
});
const apiSchema = Joi.object({
  customerId: Joi.number(),
  totalAmount: Joi.number(),
  laborCharge: Joi.number().allow(null),
  soldDate: Joi.date(),
  soldProducts: Joi.array().items(inventorySchema),
  id: Joi.number().required(),
});

const getSale = async (req, res) => {
  console.log("Get sale order Request Start");
  const { error, value } = apiSchema.validate({
    id: req.query.id,
  });

  if (error && error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }
  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();
    const { id } = value;

    const sale = await db.Sale.findOne({ where: { id, organizationId }, include: [db.Customer] });

    if (!sale) {
      return res.status(404).send({ message: "sale order not exists" });
    }

    // Fetch full company details for each sold product
    const soldProductsWithCompany = await Promise.all(
      sale.soldProducts.map(async (product) => {
        const company = await db.Company.findOne({ where: { id: product.companyId, organizationId } });
        return {
          ...product, // Directly spread the product object
          company, // Add full company details
        };
      })
    );

    // Replace the original soldProducts with the enriched data
    sale.soldProducts = soldProductsWithCompany;

    console.log("Get sale order Request End");

    return res.send(sale);
  } catch (error) {
    console.log("Get sale order Request Error:", error);

    return res.status(500).send({ message: error.toString() });
  }
};

const updateSaleOrder = async (req, res) => {
  console.log("Update sale order Request Start");
  const validateInput = pickDefinedFields(req.body, updateFields);
  validateInput.id = req.query.id;
  const { error, value } = apiSchema.validate(validateInput);

  if (error && error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }
  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();
    const { id } = value;
    const sale = await db.Sale.findOne({ where: { id, organizationId } });

    if (!sale) {
      return res.status(404).send({ message: "sale order not exist" });
    }

    if (!EDITABLE_STATUS.includes(sale.status)) {
      return res.status(400).send({ message: `sale order status is ${STATUS.APPROVED}` });
    }

    if (value.customerId) {
      const customer = await db.Customer.findOne({ where: { id: value.customerId, organizationId } });
      if (!customer) return res.status(404).send({ message: "customer not found" });
    }

    const updateData = pickDefinedFields(value, updateFields);
    updateData.status = STATUS.PENDING;
    await sale.update(updateData);
    console.log("Update sale order Request End");
    return res.send(sale);
  } catch (error) {
    console.log("Update sale order Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).put(updateSaleOrder).get(getSale);
