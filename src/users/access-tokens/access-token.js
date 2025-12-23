  import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import moment from "moment";
import knex from "../../common/config/database.config";
import { APP_KEY } from "../../../constants.js";

class AccessTokensService {
  /**
   * Generates access tokens
   * @param {number} userId
   * @param {string} email
   */
  async createToken(userId, email) {
    const jti = randomBytes(32).toString("hex");

    const jwtToken = jwt.sign(
      {
        sub: userId,
        jti,
        email,
      },
      APP_KEY,
      {
        expiresIn: "365 days",
      }
    );

    const decodedJwtToken = jwt.decode(jwtToken);

    // save
    await this.store(jti, userId, decodedJwtToken);

    return jwtToken;
  }

  /**
   * Save token in db
   * @param {string} jti
   * @param {number} userId
   * @param {object} decodedJwtToken
   *
   */
  async store(jti, userId, decodedJwtToken) {
    await knex("user_access_token").insert({
      id: jti,
      userId
    });
  }
}

export default new AccessTokensService();
