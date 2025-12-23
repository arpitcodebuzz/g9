/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('contact_us', (table) => {
    table.increments('id').primary()
    table.string('name').nullable()
    table.string('email').nullable()
    table.string('mobile_no').nullable()
    table.string('image').nullable()
    table.string('video').nullable()
    table.text('message').nullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.timestamp('updatedAt').defaultTo(knex.fn.now())
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('contact_us')
};
