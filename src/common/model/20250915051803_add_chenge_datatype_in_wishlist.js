/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('wishlist', (table) => {
    table.text('product_id').nullable().alter()
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('wishlist', (table) => {
    table.string('product_id').nullable().alter()     
  })
};
