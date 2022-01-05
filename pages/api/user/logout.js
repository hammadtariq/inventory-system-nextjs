import nextConnect from "next-connect";

import { removeTokenCookie, getTokenCookie } from "@/lib/auth-cookies";

const logout = (req, res) => {
  const token = getTokenCookie(req);

  if (!token) {
    return res.status(204).send();
  }

  removeTokenCookie(res);

  return res.send({ message: "User logged out successfully" });
};

export default nextConnect().get(logout);
