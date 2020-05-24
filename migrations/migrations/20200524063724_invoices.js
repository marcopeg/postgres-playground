
exports.up = async knex => {
  await knex.schema
    .withSchema('public')
    .createTable('invoices_headers', table => {
      table.increments('id');
      table.string('customer_name');
    })

  await knex.schema
    .withSchema('public')
    .createTable('invoices_rows', table => {
      table.increments('id');
      table.integer('invoice_header_id');
    })
};

exports.down = async (knex) => {
  await knex.schema.withSchema('public').dropTableIfExists('invoices_headers');
  await knex.schema.withSchema('public').dropTableIfExists('invoices_rows');
};
