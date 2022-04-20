import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { DEFAULT_ROWS_LIMIT } from "@/utils/api.util";

const apiSchema = Joi.object({
  companyName: Joi.string().min(3).trim().lowercase().required(),
  phone: Joi.string().max(24).trim(),
  email: Joi.string().email().trim().lowercase(),
  address: Joi.string().trim().min(10),
});

const createCompany = async (req, res) => {
  console.log("Create Company Request Start");
  const { error, value } = apiSchema.validate(req.body);
  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }
  try {
    await db.dbConnect();
    const company = await db.Company.findOne({ where: { companyName: value.companyName } });
    if (company) {
      return res.status(409).send({ message: "company already exist" });
    }

    await db.Company.create({
      ...value,
    });

    console.log("Create Company Request End");

    return res.send();
  } catch (error) {
    console.log("Create Company Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

const getAllCompanies = async (req, res) => {
  console.log("Get All Company Request Start");

  const { limit, offset, attributes = [] } = req.query;
  const options = {};
  options.limit = limit ? limit : DEFAULT_ROWS_LIMIT;
  options.offset = offset ? offset : 0;
  if (attributes.length) {
    options.attributes = JSON.parse(attributes);
  }
  try {
    await db.dbConnect();
    const data = await db.Company.findAndCountAll({ ...options, order: [["updatedAt", "DESC"]] });

    console.log("Get All Company Request End");

    return res.send(data);
  } catch (error) {
    console.log("Get All Company Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};
export default nextConnect().use(auth).post(createCompany).get(getAllCompanies);
