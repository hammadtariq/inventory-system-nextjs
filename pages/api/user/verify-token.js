import Iron from "@hapi/iron";
import nextConnect from "next-connect";

import { getTokenCookie } from "@/lib/auth-cookies";

const TOKEN_SECRET = process.env.TOKEN_SECRET;

const verifyToken = async (req, res) => {
  const token = getTokenCookie(req);

  if (!token) {
    return res.status(401).send({ isValid: false, message: "Token expired" });
  }

  try {
    const unsealedToken = await Iron.unseal(token, TOKEN_SECRET, Iron.defaults);

    if (unsealedToken && Date.now() > new Date(unsealedToken?.token?.maxAge)) {
      return res.status(401).send({ message: "Token expired" });
    }
    return res.send({ isValid: true });
  } catch (error) {
    res.status(500).send(error);
  }
};

export default nextConnect().get(verifyToken);
