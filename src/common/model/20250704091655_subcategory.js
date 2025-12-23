/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
   return knex.schema.createTable('subCategory',(table)=>{
      table.increments('id').primary()
      table
      .integer('categoryId')
      .unsigned()
      .references('id')
      .inTable('category')
      .onDelete('CASCADE')
      table.string('name').nullable()
      table.timestamp('createdAt').defaultTo(knex.fn.now())
      table.timestamp('updatedAt').defaultTo(knex.fn.now())

   })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('subCategory')
};
