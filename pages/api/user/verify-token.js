import Iron from "@hapi/iron";
import nextConnect from "next-connect";

import { getTokenCookie } from "@/lib/auth-cookies";

const TOKEN_SECRET = process.env.TOKEN_SECRET;

const verifyToken = async (req, res) => {
  console.log("Verify token Request Start");

  const token = getTokenCookie(req);

  if (!token) {
    return res.status(401).send({ isValid: false, message: "Token expired" });
  }

  try {
    const unsealedToken = await Iron.unseal(token, TOKEN_SECRET, Iron.defaults);

    if (unsealedToken && Date.now() > new Date(unsealedToken?.token?.maxAge)) {
      return res.status(401).send({ message: "Token expired" });
    }
    console.log("Verify token Request End");
    return res.send({ isValid: true });
  } catch (error) {
    console.log("Verify token Request Error:", error);
    res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().get(verifyToken);
