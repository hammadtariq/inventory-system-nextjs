import nextConnect from "next-connect";
import db from "@/lib/dbConnect";
const dbConnect = db.dbConnect;

const onNoMatch = async (req, res) => {
  res.status(405).send({
    success: false,
    error: `Requested ${req.method} method not allowed`,
  });
};

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
      succress: true,
      message: "Success",
      data: customer,
    });
  } catch (error) {
    res.send(error);
  }
};

const editCustomer = async (req, res) => {
  try {
    await dbConnect();
    const { id } = req.query;

    const customer = await db.Customer.findOne({
      where: { id },
    });
    console.log(typeof id);
    if (!customer) {
      return res
        .status(409)
        .send({ success: false, message: "Customer not exist" });
    }

    await customer.update({ firstName: "rehan1" });

    return res.send({
      succress: true,
      message: "Success PUT",
      data: customer,
    });
  } catch (error) {
    res.send(error);
  }
};

export default nextConnect({ onNoMatch }).get(getCustomer).put(editCustomer);
