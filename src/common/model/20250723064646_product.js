/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('products',(table)=>{
        table.increments('id').primary()
        table
        .integer('categoryId')
        .unsigned()
        .references('id')
        .inTable('category')
        .onDelete('CASCADE')
        table
        .integer('subCategoryId')
        .unsigned()
        .references('id')
        .inTable('subCategory')
        .onDelete('CASCADE')
        table.string('title').nullable()
        table.text('description').nullable()
        table.string('stock').nullable()
        table.string('original_price').nullable()
        table.string('selling_price').nullable()
        table.enum('status',['Active','InActive']).defaultTo('Active')
        table.timestamp('createdAt').defaultTo(knex.fn.now())
        table.timestamp('updatedAt').defaultTo(knex.fn.now())
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('products')
};
