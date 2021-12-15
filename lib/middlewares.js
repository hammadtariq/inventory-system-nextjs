import db from "@/lib/postgres";
import { compareHash } from "@/lib/bcrypt";
import { getTokenCookie } from "@/lib/auth-cookies";
import { unSeal } from "@/lib/hapiIron";

const TOKEN_SECRET = process.env.TOKEN_SECRET;

export const auth = async (req, res, next) => {
  const token = getTokenCookie(req);
  const unsealedToken = await unSeal(token, TOKEN_SECRET);
  console.log("unsealedToken: ", unsealedToken);

  if (!token) {
    return res.status(400).send({ message: "Please provide token" });
  }

  if (Date.now() > unsealedToken.maxAge) {
    return res.status(401).send({ message: "Token expired" });
  }

  try {
    await db.dbConnect();
    const user = await db.User.findByPk(2);
    if (!user) {
      res.status(401).send({ message: "Unauthorized" });
    }
    const isMatchPassword = await compareHash(value.password, user.password);
    if (!isMatchPassword) {
      return res.status(401).send({ message: "Unauthorized" });
    }

    req.user = unsealedToken;
    next();
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error });
  }
};
