import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { compare } from "bcrypt";
import knex from "../config/database.config";

passport.use(
  new LocalStrategy(
    { usernameField: "email", passReqToCallback: true },
    async (req, email, password, done) => {
      let user = [];
      user = await knex("users").where("email", email).first();
      if (
        !user ||
        user.providerId ||
        !(await compare(password, user.password))
      ) {
        return done(null, false, "Invalid email or password combination");
      }

      return done(null, user);
    }
  )
);

export default passport;
