import db from "@/lib/postgres";
import Joi from "joi";
import { apiHandler } from "@/lib/handler";

const apiSchema = Joi.object({
  companyName: Joi.string().min(3).trim(),
  phone: Joi.string().min(11).max(11).trim(),
  email: Joi.string().email().trim(),
  address: Joi.string().trim().min(10),
  id: Joi.number().required(),
});

const updateCompany = async (req, res) => {
  const { error, value } = apiSchema.validate({
    ...req.body,
    id: req.query.id,
  });

  if (error && Object.keys(error).length) {
    return res.status(400).send({ success: false, error });
  }

  try {
    await db.dbConnect();

    const company = await db.Company.findByPk(value.id);
    if (!company) {
      return res
        .status(404)
        .send({ success: false, message: "company not found" });
    }
    if (!Object.keys(req.body).length) {
      res.status(400).send({
        success: false,
        message: "Please provide at least one field",
        allowedFields: ["companyName", "phone", "email","address"],
      });
    }

    await company.update({ ...value });

    return res.send({
      success: true,
      message: "Company updated successfully",
      company,
    });
  } catch (error) {
    return res.status(500).send({ success: false, error });
  }
};

const deleteCompany = async (req, res) => {
  const { error, value } = apiSchema.validate({
    id: req.query.id,
  });

  if (error && error && Object.keys(error).length) {
    return res.status(400).send({ success: false, error });
  }

  try {
    await db.dbConnect();
    const company = await db.Company.findByPk(value.id);

    if (!company) {
      return res
        .status(404)
        .send({ success: false, message: "company does not exist" });
    }

    await db.Company.destroy({ where: { id: value.id } });

    return res.send({
      success: true,
      message: "company deleted succesfully",
      company
    });
  } catch (error) {
    return res.status(500).send({ success: false, error });
  }
};

const getCompany = async (req, res) => {
  const { error, value } = apiSchema.validate({
    id: req.query.id,
  });

  if (error && error && Object.keys(error).length) {
    return res.status(400).send({ success: false, error });
  }
  try {
    await db.dbConnect();
    const { id } = value;
    const company = await db.Company.findOne({
      where: { id },
    });

    if (!company) {
      return res
        .status(409)
        .send({ success: false, message: "company not exist" });
    }

    return res.send({
      success: true,
      message: "Success",
      data: company,
    });
  } catch (error) {
    return res.send(error);
  }
};

export default apiHandler.put(updateCompany).delete(deleteCompany).get(getCompany);
