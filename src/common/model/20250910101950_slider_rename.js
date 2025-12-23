/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasImageColumn = await knex.schema.hasColumn('slider', 'image');
  const hasSliderColumn = await knex.schema.hasColumn('slider', 'slider');

  if (hasImageColumn && !hasSliderColumn) {
    return knex.schema.alterTable('slider', (table) => {
      table.renameColumn('image', 'slider');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const hasSliderColumn = await knex.schema.hasColumn('slider', 'slider');
  const hasImageColumn = await knex.schema.hasColumn('slider', 'image');

  if (hasSliderColumn && !hasImageColumn) {
    return knex.schema.alterTable('slider', (table) => {
      table.renameColumn('slider', 'image');
    });
  }
};
