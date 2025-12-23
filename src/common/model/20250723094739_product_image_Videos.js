/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('product_images',(table)=>{
      table.increments('id').primary()
      table
      .integer('productId')
      .unsigned()
      .references('id')
      .inTable('products')
      .onDelete('CASCADE')
      table.string('image').nullable()
      table.string('video').nullable()
      table.timestamp('createdAt').defaultTo(knex.fn.now())
      table.timestamp('updatedAt').defaultTo(knex.fn.now())
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('product_images')
};
