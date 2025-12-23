/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.alterTable('products',(table)=>{
      table.string('estimatedTime').nullable()
      table.boolean('readyToShip').defaultTo(false)
      table.boolean('discounted').defaultTo(false)
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
   return knex.schema.alterTable('products',(table)=>{
      table.dropColumn('estimatedTime')
      table.dropColumn('readyToShip')
      table.dropColumn('discounted')
    })
};
