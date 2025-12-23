/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('newArrival', (table) => {
    table.increments('id').primary()
    table.string('banner').nullable()
    table.string('stockNumber').nullable()
    table.string('productId').nullable()
    table.string('categoryId').nullable()
    table.string('subcategoryId').nullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.timestamp('updatedAt').defaultTo(knex.fn.now())
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('newArrival')
};
