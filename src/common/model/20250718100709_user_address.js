/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('user_address', (table) => {
    table.increments('id').primary()
    table.string('address_line_1').nullable()
    table.string('address_line_2').nullable()
    table.string('city').nullable()
    table.string('state').nullable()
    table.string('country').nullable()
    table.string('postal_code').nullable()
    table.enum('address_type', ['Home', 'Work', 'Other']).nullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.timestamp('updatedAt').defaultTo(knex.fn.now())
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('user_address')
};
