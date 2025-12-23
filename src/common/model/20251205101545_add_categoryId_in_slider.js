/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('slider', (table) => {
    table.string('categoryId').nullable()
    table.string('subcategoryId').nullable()
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('slider', (table) => {
    table.dropColumn('categoryId').nullable()
    table.dropColumn('subcategoryId').nullable()
  })
};
