/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.string('mobile_otp').nullable();
    table.string('mobile_otp_expire_time').nullable();
    table.string('mobile_Otp_Verification').defaultTo('pending')
    table.renameColumn('otp', 'email_otp');
    table.renameColumn('otpExpireTime', 'email_otp_expire_time');

  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('mobile_otp');
    table.dropColumn('mobile_otp_expire_time');
    table.dropColumn('mobile_Otp_Verification')
    table.renameColumn('email_otp', 'otp');
    table.renameColumn('email_otp_expire_time', 'otpExpireTime');
  });
};
