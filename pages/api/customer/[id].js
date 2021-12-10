import db from "@/lib/postgres";
import { apiHandler } from "@/lib/handler";
const dbConnect = db.dbConnect;

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
    if (!customer) {
      return res
        .status(409)
        .send({ success: false, message: "Customer not exist" });
    }

    await customer.update({ ...req.body });

    return res.send({
      succress: true,
      message: "Success PUT",
      data: customer,
    });
  } catch (error) {
    res.send(error);
  }
};

export default apiHandler.get(getCustomer).put(editCustomer);
