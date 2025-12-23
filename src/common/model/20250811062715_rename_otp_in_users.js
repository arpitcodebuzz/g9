/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.renameColumn('email_otp', 'otp');
    table.renameColumn('email_otp_expire_time', 'otpExpireTime');
    table.string('whatsapp_Otp_Verification').defaultTo('pending');
    table.string('lastOtpChannel').nullable();
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.renameColumn('otp', 'email_otp');
    table.renameColumn('otpExpireTime', 'email_otp_expire_time');
    table.dropColumn('whatsapp_Otp_Verification')
    table.dropColumn('lastOtpChannel');
  })
};
