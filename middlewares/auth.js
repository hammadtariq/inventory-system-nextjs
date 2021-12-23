import Iron from "@hapi/iron";

import db from "@/lib/postgres";
import { getTokenCookie } from "@/lib/auth-cookies";

const TOKEN_SECRET = process.env.TOKEN_SECRET;

export const auth = async (req, res, next) => {
  // const token = getTokenCookie(req);

  // if (!token) {
  //   return res.status(401).send({ message: "Please login first" });
  // }

  try {
    // const unsealedToken = await Iron.unseal(token, TOKEN_SECRET, Iron.defaults);

    // if (unsealedToken && Date.now() > new Date(unsealedToken.maxAge)) {
    //   return res.status(401).send({ message: "Token expired" });
    // }

    // await db.dbConnect();
    // const user = await db.User.findByPk(unsealedToken.id, { attributes: { exclude: ["password"] } });
    // if (!user) return res.status(401).send({ message: "User not found" });

    // res.user = unsealedToken;

    next();
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};
