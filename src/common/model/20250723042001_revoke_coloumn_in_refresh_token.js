/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('user_refresh_token', (table) => {
    table.boolean("revoked").defaultTo(false);

  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('user_refresh_token',(table)=>{
    table.dropColumn('revoked')
  })
};
