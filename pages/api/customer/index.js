import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const dbConnect = db.dbConnect;

const customerRegistration = async (req, res) => {
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
      return res.status(409).send({ success: false, message: "Customer already exist" });
    }

    await db.Customer.create({
      firstName,
      lastName,
      email,
      phone,
      address,
    });

    return res.send({
      success: true,
      message: "Customer registered successfully",
    });
  } catch (error) {
    return res.send(error);
  }
};

const getAllCustomers = async (req, res) => {
  try {
    await dbConnect();
    const customers = await db.Customer.findAll();

    return res.send({
      succress: true,
      message: "All Customers",
      data: customers,
    });
  } catch (error) {
    res.send(error);
  }
};

export default nextConnect().use(auth).post(customerRegistration).get(getAllCustomers);
