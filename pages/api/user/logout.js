import { removeTokenCookie, parseCookies } from "@/lib/auth-cookies";
import nextConnect from "next-connect";

export default nextConnect().get((req, res) => {
  const { token } = parseCookies(req);

  if (!token) {
    return res.send({ message: "User already logged out" });
  }

  removeTokenCookie(res);

  res.send({ message: "Logout successcully" });
});
