/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('complaintQuery', (table) => {
    table.string('userId').nullable()
    table.renameColumn('email', 'email_mobileNo');
    table.dropColumn('mobileNo');
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('complaintQuery', (table) => {
    table.dropColumn('userId').nullable()
    table.renameColumn('email_mobileNo', 'email');
    table.string('mobileNo').nullable();
  })
};
