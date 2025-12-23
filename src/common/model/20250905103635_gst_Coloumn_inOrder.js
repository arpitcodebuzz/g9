/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('orders', (table) => {
    table.string('name').nullable()
    table.string('GstNumber').nullable()
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('orders', (table) => {
    table.dropColumn('name')
    table.dropColumn('GstNumber')
  })
};
