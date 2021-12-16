import Joi from "joi";
import db from "@/lib/postgres";
import { apiHandler } from "@/lib/handler";

const apiSchema = Joi.object({
  companyName: Joi.string().min(3).trim().required(),
  phone: Joi.string().max(24).trim().required(),
  email: Joi.string().email().trim().required(),
  address: Joi.string().trim().required().min(10),
});

const createCompany = async (req, res) => {
  const { error, value } = apiSchema.validate(req.body);
  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error });
  }
  try {
    await db.dbConnect();
    const company = await db.Company.findOne({ where: { email: value.email } });
    if (company) {
      return res.status(409).send({ message: "company already exist" });
    }

    await db.Company.create({
      ...value,
    });

    return res.send();
  } catch (error) {
    return res.status(500).send({ message: error });
  }
};

const getAllCompanies = async (req, res) => {
  const { limit, offset } = req.query;
  const pagination = {};
  pagination.limit = limit ? limit : 10;
  pagination.offset = offset ? offset : 0;
  try {
    await db.dbConnect();
    const data = await db.Company.findAndCountAll(pagination);

    return res.send(data);
  } catch (error) {
    return res.status(500).send({ message: error });
  }
};
export default apiHandler.post(createCompany).get(getAllCompanies);
