import db from "@/lib/postgres";
import Joi from "joi";
import { apiHandler } from "@/lib/handler";

const apiSchema = Joi.object({
  companyName: Joi.string().min(3).trim().required(),
  phone: Joi.string().min(11).max(11).trim().required(),
  email: Joi.string().email().trim().required(),
  address: Joi.string().trim().required().min(10),
});

const createCompany = async (req, res) => {
  const { error, value } = apiSchema.validate(req.body);
  if (error && Object.keys(error).length) {
    return res.status(400).send({ success: false, error });
  }
  try {
    await db.dbConnect();
    const company = await db.Company.findOne({ where: { email: value.email } });
    if (company) {
      return res.status(409).send({ success: false, message: "company already exist" });
    }

    await db.Company.create({
      ...value,
    });

    return res.send({
      success: true,
      message: "company created successfully",
    });
  } catch (error) {
    return res.status(500).send(error);
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

    return res.send({
      success: true,
      message: "Success",
      data,
    });
  } catch (error) {
    return res.send(error);
  }
};
export default apiHandler.post(createCompany).get(getAllCompanies);
