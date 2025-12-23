exports.up = function (knex) {
  return knex.schema.alterTable('products', (table) => {
    // Add new columns
    table.text('purity').nullable();
    table.string('metals', 255).nullable();
    table.enum('diamondCut', ['excellent', 'verygood', 'good']).nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('products', (table) => {
    table.dropColumn('purity');
    table.dropColumn('metals');
    table.dropColumn('diamondCut');
  });
};
