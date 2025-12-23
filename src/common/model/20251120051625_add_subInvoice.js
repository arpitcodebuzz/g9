/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('subInvoice', (table) => {
    table.increments('id').primary()
    table.string('mainInvoiceId').nullable()
    table.string('invoiceNo').nullable()
    table.string('subInvoice').nullable()
    table.string('orderId').nullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.timestamp('updatedAt').defaultTo(knex.fn.now())
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('subInvoice')
};
