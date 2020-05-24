exports.up = async (knex) => {
  await knex.schema.withSchema('public').createTable('products', (table) => {
    table.increments('id');
    table.string('code');
    table.string('description');
    table.integer('price').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.unique('code');
  });
};

exports.down = async (knex) => {
  await knex.schema.withSchema('public').dropTableIfExists('products');
};
