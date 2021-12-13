import db from "@/lib/postgres";
import { apiHandler } from "@/lib/handler";
import { auth } from "@/middleware/auth";

const login = async (req, res) => {
  res.send({ success: true, message: "login works" });
};

export default apiHandler.use(auth).post(login);
