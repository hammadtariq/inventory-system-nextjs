import nextConnect from "next-connect";
import Joi from "joi";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { DEFAULT_ROWS_LIMIT } from "@/utils/api.util";

const dbConnect = db.dbConnect;

const apiSchema = Joi.object({
  firstName: Joi.string().min(3).trim().lowercase().required(),
  lastName: Joi.string().min(3).trim().lowercase().required(),
  email: Joi.string().email().trim().lowercase().required(),
  phone: Joi.string().max(24).trim(),
  address: Joi.string().trim().min(10),
});

const customerRegistration = async (req, res) => {
  console.log("Create Customer Request Start");

  const { error, value } = apiSchema.validate(req.body);
  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }

  try {
    await dbConnect();
    const customer = await db.Customer.findOne({ where: { email: value.email } });

    // if user already exist
    if (customer) {
      return res.status(409).send({ message: "Customer already exist" });
    }

    await db.Customer.create({
      ...value,
    });
    console.log("Create Customer Request End");

    return res.send({
      success: true,
      message: "Customer registered successfully",
    });
  } catch (error) {
    console.log("Create Customer Request Error:", error);

    return res.status(500).send({ message: error.toString() });
  }
};

const getAllCustomers = async (req, res) => {
  console.log("Get all Customer Request Start");
  const { limit, offset, attributes = [] } = req.query;
  const options = {};
  options.limit = limit ? limit : DEFAULT_ROWS_LIMIT;
  options.offset = offset ? offset : 0;
  if (attributes.length) {
    options.attributes = JSON.parse(attributes);
  }

  try {
    await dbConnect();
    const customers = await db.Customer.findAndCountAll({ ...options, order: [["updatedAt", "DESC"]] });
    console.log("Get all Customer Request End");
    return res.send(customers);
  } catch (error) {
    console.log("Get all Customer Request Error:", error);
    res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).post(customerRegistration).get(getAllCustomers);
