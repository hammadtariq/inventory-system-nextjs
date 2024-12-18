import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { EDITABLE_STATUS, STATUS } from "@/utils/api.util";

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
    const { id } = value;

    const sale = await db.Sale.findByPk(id, { include: [db.Customer] });

    if (!sale) {
      return res.status(404).send({ message: "sale order not exists" });
    }

    // Fetch full company details for each sold product
    const soldProductsWithCompany = await Promise.all(
      sale.soldProducts.map(async (product) => {
        const company = await db.Company.findByPk(product.companyId);
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
  const { error, value } = apiSchema.validate({
    ...req.body,
    id: req.query.id,
  });

  if (error && error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }
  try {
    await db.dbConnect();
    const { id } = value;
    const sale = await db.Sale.findByPk(id);

    if (!sale) {
      return res.status(404).send({ message: "sale order not exist" });
    }

    if (!EDITABLE_STATUS.includes(sale.status)) {
      return res.status(400).send({ message: `sale order status is ${STATUS.APPROVED}` });
    }

    await sale.update({ ...value, status: STATUS.PENDING });
    console.log("Update sale order Request End");
    return res.send(sale);
  } catch (error) {
    console.log("Update sale order Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).put(updateSaleOrder).get(getSale);
