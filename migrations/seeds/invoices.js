exports.seed = async knex => {
  await knex('invoices_headers').del();
  await knex('invoices_rows').del();

  const r1 = await knex.raw(`
    WITH
    header AS (
      INSERT INTO invoices_headers 
      (customer_name) VALUES ('foo') 
      RETURNING id
    ),
    rows AS (
      INSERT INTO invoices_rows 
      (invoice_header_id) VALUES ((SELECT id FROM header)) 
      RETURNING *
    )
    SELECT * FROM header
  `)

  console.log(r1.rows)
};