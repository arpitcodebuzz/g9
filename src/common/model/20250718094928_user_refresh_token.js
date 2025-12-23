/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('user_refresh_token', (table) => {
    table.string('id').primary()
    table.string("accessTokenId");
    table
      .foreign("accessTokenId")
      .references("user_access_token.id")
      .onDelete("CASCADE");
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('user_refresh_token')
};
