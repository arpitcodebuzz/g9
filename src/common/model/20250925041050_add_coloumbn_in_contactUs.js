/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('contact_us', (table) => {
    table.string('email_mobileNo').nullable()
    table.string('userId').nullable()
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('contact_us', (table) => {
    table.dropColumn('email_mobileNo')
    table.dropColumn('userId')
  })
};
