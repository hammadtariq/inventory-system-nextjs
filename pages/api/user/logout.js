import nextConnect from "next-connect";

import { removeTokenCookie, getTokenCookie } from "@/lib/auth-cookies";

const logout = (req, res) => {
  console.log("Logout Request Start");

  const token = getTokenCookie(req);

  if (!token) {
    return res.status(204).send();
  }

  removeTokenCookie(res);
  console.log("Logout Request End");
  return res.send({ message: "User logged out successfully" });
};

export default nextConnect().get(logout);
