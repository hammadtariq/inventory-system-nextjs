import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const dbConnect = db.dbConnect;

const getCustomer = async (req, res) => {
  console.log("Get Customer Request Start");
  try {
    await dbConnect();
    const { id } = req.query;
    const customer = await db.Customer.findByPk(id);

    if (!customer) {
      return res.status(409).send({ message: "Customer not exist" });
    }
    console.log("Get Customer Request End");
    return res.send({
      success: true,
      message: "Success",
      data: customer,
    });
  } catch (error) {
    console.log("Get Customer Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

const editCustomer = async (req, res) => {
  console.log("Edit Customer Request Start");
  const apiSchema = Joi.object({
    firstName: Joi.string().min(3).trim(),
    lastName: Joi.string().min(3).trim(),
    email: Joi.string().email().trim(),
    phone: Joi.string().max(24).trim(),
    address: Joi.string().trim().min(10),
    id: Joi.number().required(),
  });

  const { error, value } = apiSchema.validate({
    ...req.body,
    id: req.query.id,
  });

  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }

  try {
    await dbConnect();

    const customer = await db.Customer.findByPk(value.id);
    if (!customer) {
      return res.status(409).send({ message: "Customer not exist" });
    }

    await customer.update({ ...value });

    console.log("Edit Customer Request End");

    return res.send({
      success: true,
      message: "Update Successfully",
      data: customer,
    });
  } catch (error) {
    console.log("Edit Customer Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

const deleteCustomer = async (req, res) => {
  console.log("Delete Customer Request Start");

  const { id } = req.query;

  try {
    await dbConnect();

    const customer = await db.Customer.destroy({
      where: { id },
    });
    if (!customer) {
      return res.status(409).send({ message: "Customer not exist" });
    }
    console.log("Delete Customer Request End");

    return res.send({
      success: true,
      message: "Deleted Successfully",
    });
  } catch (error) {
    console.log("Delete Customer Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(getCustomer).put(editCustomer).delete(deleteCustomer);
