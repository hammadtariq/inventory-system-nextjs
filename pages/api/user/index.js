import db from "@/lib/postgres";
import { apiHandler } from "@/lib/handler";

const allUsers = async (_, res) => {
  try {
    await db.dbConnect();
    const users = await db.User.findAll({
      attributes: { exclude: ["password"] },
    });

    if (!users.length) {
      return res.send({ success: true, message: "No user found", users });
    }

    res.send({ success: true, users });
  } catch (error) {
    res.status(500).send({ success: false, error });
  }
};

export default apiHandler.get(allUsers);
