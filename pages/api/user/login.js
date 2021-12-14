import { apiHandler } from "@/lib/handler";
import { auth } from "../../../middleware/auth";

const login = async (req, res) => {
  console.log("req", req.user);
  res.json({ success: true, message: "login works" });
};

export default apiHandler.use(auth).post(login);
