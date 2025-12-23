import passport from "passport";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import moment from "moment";
import knex from "../config/database.config";
import { APP_KEY } from "../../../constants.js";

// require('dotenv').config()

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: APP_KEY,
};

passport.use(
  new JwtStrategy(options, async (jwtPayload, done) => {
    try {
      // console.log("jwtPayload-----------", jwtPayload);

      if (!jwtPayload.type) {
        jwtPayload.type = "user";
      }

        if (jwtPayload.type == "user") {
        if (moment.utc().unix() > jwtPayload.exp) {
          return done(null, false);
        }
        const checkToken = await knex("user_access_token")
          .where("user_access_token.id", jwtPayload.jti)
          .where("user_access_token.userId", jwtPayload.sub)
          .where("user_access_token.revoked", false)
          .innerJoin("users", "user_access_token.userId", "=", "users.id")
          .first();

        if (
          !checkToken ||
          moment.utc().unix() > moment.unix(checkToken.expiresAt)
        ) {
          return done(null, false);
        }

        const user = await knex("users")
          .where({
            id: jwtPayload.sub,
          })
          .first();

        if (!user) {
          return done(null, false);
        }

        delete user.password;
        user.jti = jwtPayload.jti;
        return done(null, user);
      }
    } catch (error) {
      console.log(error);
      return done(error, false);
    }
  })
);
