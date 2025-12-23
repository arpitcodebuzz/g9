/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('products', (table) => {
    table
      .integer('goldPurityId')
      .unsigned()
      .references('id')
      .inTable('goldPurity')
      .onDelete('CASCADE');
    table
      .integer('stoneShapeId')
      .unsigned()
      .references('id')
      .inTable('stoneShape')
      .onDelete('CASCADE');
    table
      .integer('metalId')
      .unsigned()
      .references('id')
      .inTable('metals')
      .onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('products', (table) => {
    table.dropColumn('goldPurityId');
    table.dropColumn('stoneShapeId');
    table.dropColumn('metalId');
  });
};
