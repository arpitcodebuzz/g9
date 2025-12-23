/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const categories = ["Men's", "Women's", "Accessories"];

  for (const name of categories) {
    const exists = await knex('category').where({ name }).first();
    if (!exists) {
      await knex('category').insert({ name, status: 'Active' });
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex('category')
    .whereIn('name', ["Men's", "Women's", "Accessories"])
    .del();
};
