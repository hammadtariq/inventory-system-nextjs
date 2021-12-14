import nextConnect from "next-connect";
import passport from "passport";
// import passport from "@/lib/passport";

export const auth = nextConnect()
  .use(passport.initialize())
  .use(passport.authenticate("local", { session: false }));
