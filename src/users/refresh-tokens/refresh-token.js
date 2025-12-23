import moment from "moment";
import crypto from "crypto";
import knex from "../../common/config/database.config";
import { encrypt } from "../../common/helper";

class RefreshTokensService {
  /**
   * Create refresh token
   * @param {string} jti
   * @param {string} expiresAt
   *
   * @return {Promise<string>} refresh token
   */
  async createToken(jti, expiresAt) {
    const id = crypto.randomBytes(32).toString("hex");

    await knex("user_refresh_token").insert({
      id,
      accessTokenId: jti,
    });

    return encrypt(id);
  }
}

export default new RefreshTokensService();
