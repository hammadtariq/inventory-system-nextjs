import { apiHandler } from "@/lib/handler";
import { auth } from "../../../middleware/auth";

const login = async (req, res) => {
  res.json({ success: true, message: "login works", user: req.user });
};

export default apiHandler.use(auth).post(login);
