exports.up = async (knex) => {
  await knex.schema.withSchema('public').createTable('contacts', (table) => {
    table.increments('id');
    table.string('name');
    table.string('city');
    table.integer('updates_count').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.unique('name');
  });
};

exports.down = async (knex) => {
  await knex.schema.withSchema('public').dropTableIfExists('contacts');
};
