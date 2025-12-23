/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('settings', (table) => {
    table.increments('id').primary()
    table.string('deliveryCharge').nullable()
    table.string('InsuranceCharge').nullable()
    table.string('returnCharge').nullable()
    table.integer('askPrice').nullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.timestamp('updatedAt').defaultTo(knex.fn.now())
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('settings')
};
