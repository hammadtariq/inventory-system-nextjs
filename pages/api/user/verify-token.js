import nextConnect from "next-connect";

import { getTokenCookie } from "@/lib/auth-cookies";

const verifyToken = async (req, res) => {
  const token = getTokenCookie(req);

  if (!token) {
    return res.status(401).send({ isValid: false, message: "Token expired" });
  }

  return res.send({ isValid: true });
};

export default nextConnect().get(verifyToken);
