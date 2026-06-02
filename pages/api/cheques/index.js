import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { DEFAULT_ROWS_LIMIT } from "@/utils/api.util";
import TenantContext from "@/lib/tenant-context";

const dbConnect = db.dbConnect;

const apiSchema = Joi.object({
  id: Joi.number().required(),
  status: Joi.string().required(),
});

const getAllCheques = async (req, res) => {
  console.log("Get all Cheques Request Start");
  const { limit, offset } = req.query;
  const pagination = {};
  pagination.limit = limit ? limit : DEFAULT_ROWS_LIMIT;
  pagination.offset = offset ? offset : 0;

  try {
    await dbConnect();
    const organizationId = TenantContext.assertGet();
    const cheques = await db.Cheque.findAndCountAll({
      ...pagination,
      where: { organizationId },
      order: [["updatedAt", "DESC"]],
    });
    console.log("Get all Cheques Request End");

    return res.send(cheques);
  } catch (error) {
    console.log("Get all Cheques Request Error:", error);
    res.status(500).send({ message: error.toString() });
  }
};

const updateChequeStatus = async (req, res) => {
  console.log("Cheques Update Request Start");

  const { error, value } = apiSchema.validate({
    id: req.body.id,
    status: req.body.status,
  });

  if (error && error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }
  if (!["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
    return res.status(400).send({ message: "Operation not permitted." });
  }

  try {
    await dbConnect();
    const organizationId = TenantContext.assertGet();
    const { id, status } = value;

    const cheque = await db.Cheque.findOne({ where: { id, organizationId } });
    if (!cheque) {
      return res.status(404).send({ message: "cheque not found" });
    }
    await cheque.update({ status });

    console.log("Cheques Update Request End");

    return res.send();
  } catch (error) {
    console.log("Cheques Update Request Error:", error);
    res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(getAllCheques).put(updateChequeStatus);
