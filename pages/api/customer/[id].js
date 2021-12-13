import db from "@/lib/postgres";
import Joi from "joi";
import { apiHandler } from "@/lib/handler";
const dbConnect = db.dbConnect;

const getCustomer = async (req, res) => {
  try {
    await dbConnect();
    const { id } = req.query;
    const customer = await db.Customer.findOne({
      where: { id },
    });

    if (!customer) {
      return res
        .status(409)
        .send({ success: false, message: "Customer not exist" });
    }

    return res.send({
      success: true,
      message: "Success",
      data: customer,
    });
  } catch (error) {
    return res.send(error);
  }
};

const editCustomer = async (req, res) => {
  const apiSchema = Joi.object({
    firstName: Joi.string().min(3).trim(),
    lastName: Joi.string().min(3).trim(),
    email: Joi.string().email().trim(),
    id: Joi.number().required(),
  });

  const { error, value } = apiSchema.validate({
    ...req.body,
    id: req.query.id,
  });

  if (error && Object.keys(error).length) {
    return res.status(400).send({ success: false, error });
  }

  try {
    await dbConnect();

    const customer = await db.Customer.findOne({
      where: { id: value.id },
    });
    if (!customer) {
      return res
        .status(409)
        .send({ success: false, message: "Customer not exist" });
    }

    await customer.update({ ...value });

    return res.send({
      success: true,
      message: "Update Successfully",
      data: customer,
    });
  } catch (error) {
    return res.send({ success: false, error });
  }
};

const deleteCustomer = async (req, res) => {
  const { id } = req.query;

  try {
    await dbConnect();

    const customer = await db.Customer.destroy({
      where: { id },
    });
    if (!customer) {
      return res
        .status(409)
        .send({ success: false, message: "Customer not exist" });
    }

    return res.send({
      success: true,
      message: "Deleted Successfully",
    });
  } catch (error) {
    return res.send({ success: false, error });
  }
};

export default apiHandler
  .get(getCustomer)
  .put(editCustomer)
  .delete(deleteCustomer);
