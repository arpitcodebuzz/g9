/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('ask_price', (table) => {
    table.increments('id').primary()
    table.string('name').nullable()
    table.string('email').nullable()
    table.string('mobile_number').nullable()
    table.text('askPriceReq').nullable()
    table.text('askPriceRes').nullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.timestamp('updatedAt').defaultTo(knex.fn.now())
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('ask_price')
};
