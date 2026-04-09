import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { STATUS } from "@/utils/api.util";
import { getReturnableProducts, getReturnedMetricsMap } from "@/utils/saleReturn.util";

const apiSchema = Joi.object({
  saleId: Joi.number().required(),
});

const getReturnableSale = async (req, res) => {
  console.log("Get returnable sale Request Start");

  const { error, value } = apiSchema.validate({
    saleId: req.query.saleId,
  });

  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }

  try {
    await db.dbConnect();

    const sale = await db.Sale.findByPk(value.saleId, {
      include: [db.Customer],
    });

    if (!sale) {
      return res.status(404).send({ message: "sale order not exists" });
    }

    if (sale.status !== STATUS.APPROVED) {
      return res.status(400).send({ message: "Only approved sales can be returned" });
    }

    const saleReturns = await db.SaleReturn.findAll({
      where: { saleId: sale.id },
      order: [["id", "ASC"]],
    });

    const soldProductsWithCompany = await Promise.all(
      (sale.soldProducts || []).map(async (product) => {
        const company = await db.Company.findByPk(product.companyId);
        return {
          ...product,
          company,
        };
      })
    );

    const returnedMetricsMap = getReturnedMetricsMap(saleReturns);
    const returnableProducts = getReturnableProducts(soldProductsWithCompany, returnedMetricsMap);

    console.log("Get returnable sale Request End");
    return res.send({
      ...sale.toJSON(),
      soldProducts: soldProductsWithCompany,
      returnableProducts,
      saleReturns,
    });
  } catch (err) {
    console.log("Get returnable sale Request Error:", err);
    return res.status(500).send({ message: err.toString() });
  }
};

export default nextConnect().use(auth).get(getReturnableSale);
