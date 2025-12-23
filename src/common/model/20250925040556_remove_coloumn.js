/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('contact_us', (table) => {
    table.dropColumn('email_mobileNo')
    table.dropColumn('userId')
    table.dropColumn('mobile_no')
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('contact_us', (table) => {
    table.string('email_mobileNo').nullable();
    table.string('userId').nullable();
    table.string('mobile_no').nullable();
  });
};
