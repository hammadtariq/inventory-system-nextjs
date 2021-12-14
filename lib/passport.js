import passport from "passport";
import LocalStrategy from "passport-local";

import db from "@/lib/postgres";
import { compareHash } from "@/lib/bcrypt";

passport.serializeUser(function (user, done) {
  delete user.password;
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

const authenticateUser = async (email, password, done) => {
  try {
    await db.dbConnect();
    const user = await db.User.findOne({ email });
    if (!user) {
      return done(null, false);
    }

    const isMatchPasssword = await compareHash(password, user.password);

    if (!isMatchPasssword) {
      return done(null, false);
    }

    delete user.password;

    return done(null, user);
  } catch (error) {
    done(error);
  }
};

passport.use(
  new LocalStrategy.Strategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    authenticateUser
  )
);

export default passport;
