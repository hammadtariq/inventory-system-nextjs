import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { requireRole, onError } from "@/lib/authz";
import { DEFAULT_ROWS_LIMIT } from "@/utils/api.util";
import TenantContext from "@/lib/tenant-context";

export const getAllUsers = async (req, res) => {
  console.log("get all users Request Start");
  requireRole("ADMIN", "SUPER_ADMIN")(req.user);
  const { limit, offset } = req.query;
  const pagination = {};
  pagination.limit = limit ? limit : DEFAULT_ROWS_LIMIT;
  pagination.offset = offset ? offset : 0;
  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();
    const users = await db.User.findAndCountAll({
      ...pagination,
      where: { organizationId },
      attributes: { exclude: ["password"] },
      order: [["updatedAt", "DESC"]],
    });

    console.log("get all users Request End");

    return res.send(users);
  } catch (error) {
    console.log("get all users Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect({ onError }).use(auth).get(getAllUsers);
