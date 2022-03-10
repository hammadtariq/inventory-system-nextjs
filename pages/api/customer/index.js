import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const dbConnect = db.dbConnect;

const customerRegistration = async (req, res) => {
  console.log("Create Customer Request Start");

  const { firstName, lastName, email, phone, address } = req.body;

  if (!firstName || !lastName || !email) {
    return res.status(400).send({
      success: false,
      message: "Please provide all fields",
      required: ["firstName", "lastName", "email"],
    });
  }

  try {
    await dbConnect();
    const customer = await db.Customer.findOne({ where: { email } });

    // if user already exist
    if (customer) {
      return res.status(409).send({ message: "Customer already exist" });
    }

    await db.Customer.create({
      firstName,
      lastName,
      email,
      phone,
      address,
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
  const { attributes = [] } = req.query;
  const options = {};
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
