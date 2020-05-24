exports.up = async (knex) => {
  await knex.schema
    .withSchema('public')
    .createTable('invoices_headers', (table) => {
      table.increments('id');
      table.integer('contact_id');
      table.timestamp('date');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.foreign('contact_id').references('contacts.id');
    });

  await knex.schema
    .withSchema('public')
    .createTable('invoices_rows', (table) => {
      table.increments('id');
      table.integer('invoice_header_id').notNullable();
      table.integer('product_id').notNullable();
      table.string('description').notNullable();
      table.integer('price').notNullable();
      table.integer('quantity').notNullable();

      table.foreign('invoice_header_id').references('invoices_headers.id');
      table.foreign('product_id').references('products.id');
    });
};

exports.down = async (knex) => {
  await knex.schema.withSchema('public').dropTableIfExists('invoices_rows');
  await knex.schema.withSchema('public').dropTableIfExists('invoices_headers');
};
