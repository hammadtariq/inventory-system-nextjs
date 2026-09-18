import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { DEFAULT_ROWS_LIMIT } from "@/utils/api.util";

const requireAdmin = (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") {
    res.status(403).send({ message: "Operation not permitted." });
    return false;
  }
  return true;
};

export const getPublicPaymentRequests = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { limit, offset, status } = req.query;
  const where = {};
  if (status) {
    where.status = status;
  }

  try {
    await db.dbConnect();
    const requests = await db.PublicPaymentRequest.findAndCountAll({
      limit: limit || DEFAULT_ROWS_LIMIT,
      offset: offset || 0,
      where,
      order: [["createdAt", "DESC"]],
    });

    return res.send(requests);
  } catch (error) {
    console.log("Get public payment requests error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(getPublicPaymentRequests);
