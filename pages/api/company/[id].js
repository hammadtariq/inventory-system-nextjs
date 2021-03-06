import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const apiSchema = Joi.object({
  companyName: Joi.string().min(3).trim().lowercase(),
  phone: Joi.string().max(24).trim(),
  email: Joi.string().email().trim().lowercase(),
  address: Joi.string().trim().min(10),
  id: Joi.number().required(),
});

const updateCompany = async (req, res) => {
  const { error, value } = apiSchema.validate({
    ...req.body,
    id: req.query.id,
  });

  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error });
  }

  try {
    await db.dbConnect();

    const company = await db.Company.findByPk(value.id);
    if (!company) {
      return res.status(404).send({ message: "company not found" });
    }
    if (!Object.keys(req.body).length) {
      res.status(400).send({
        message: "Please provide at least one field",
        allowedFields: ["companyName", "phone", "email", "address"],
      });
    }

    await company.update({ ...value });

    return res.send();
  } catch (error) {
    return res.status(500).send({ message: error.toString() });
  }
};

const deleteCompany = async (req, res) => {
  const { error, value } = apiSchema.validate({
    id: req.query.id,
  });

  if (error && error && Object.keys(error).length) {
    return res.status(400).send({ message: error });
  }

  try {
    await db.dbConnect();
    const company = await db.Company.findByPk(value.id);

    if (!company) {
      return res.status(404).send({ message: "company does not exist" });
    }

    await db.Company.destroy({ where: { id: value.id } });

    return res.send();
  } catch (error) {
    return res.status(500).send({ message: error.toString() });
  }
};

const getCompany = async (req, res) => {
  const { error, value } = apiSchema.validate({
    id: req.query.id,
  });

  if (error && error && Object.keys(error).length) {
    return res.status(400).send({ message: error });
  }
  try {
    await db.dbConnect();
    const { id } = value;
    const company = await db.Company.findByPk(id);

    if (!company) {
      return res.status(409).send({ message: "company not exist" });
    }

    return res.send(company);
  } catch (error) {
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).put(updateCompany).delete(deleteCompany).get(getCompany);
