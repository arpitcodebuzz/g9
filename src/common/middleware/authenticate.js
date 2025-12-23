import passport from "passport";
import UnauthorizeException from "../exceptions/unauthorize.exception";

export default (req, res, next) => {

  passport.authenticate("jwt", { session: false }, (err, user, info) => {

    if (err) {
      return next(new UnauthorizeException((info && info.message) || err));
    }

    if (!user) {
      if (info && info.message) {
        if (info.message === "No auth token") {
          return res.status(401).json({
            status: false,
            message: "Token not provided"
          });
        }
        return res.status(401).json({
          status: false,
          message: "Invalid or expired token"
        });
      }

      return res.status(401).json({
        status: false,
        message: "Unauthorized access"
      });
    }


    req.user = user;
    return next();
  })(req, res, next);
};
