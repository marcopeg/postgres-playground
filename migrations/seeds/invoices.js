exports.seed = async (knex) => {
  await knex('contacts').del();
  await knex('products').del();
  await knex('invoices_headers').del();
  await knex('invoices_rows').del();

  const r1 = await knex.raw(`
    WITH
    invoice_data (name, date) AS (
      VALUES ('marco', '2020-05-24')
    ),
    products_data (code, description, price, quantity) AS (
      VALUES
        ('lfb', 'loafs of bread', 250, 20),
        ('lfb', 'loafs of bread', 150, 10),
        ('br', 'beer', 100, 10)
    ),

    -- Upsert the contact's informations so to retrieve the internal ID
    contacts_rows AS (
      INSERT INTO public.contacts AS t1 (name) SELECT name FROM invoice_data
      ON CONFLICT (name) DO UPDATE SET created_at = t1.created_at
      RETURNING id, name
    ),

    -- Upsert the products' rows so to retrieve the internal ID
    products_rows AS (
      INSERT INTO public.products AS t1
        (code, description, price)
        SELECT DISTINCT ON (code) code, description, price FROM products_data
      ON CONFLICT (code)
      DO UPDATE SET created_at = t1.created_at
      RETURNING id, code
    ),

    -- Write the invoice's header
    invoice_header AS (
      INSERT INTO public.invoices_headers
        (contact_id, date)
        SELECT t1.id AS contact_id, t2.date::timestamp FROM contacts_rows AS t1
        JOIN invoice_data AS t2 ON t1.name = t2.name
      RETURNING *
    ),

    -- Write the invoice's rows
    invoice_rows AS (
      INSERT INTO public.invoices_rows
        (invoice_header_id, product_id, description, price, quantity)
        SELECT t1.invoice_header_id, t2.product_id, t2.description, t2.price, t2.quantity FROM (
          SELECT id AS invoice_header_id, 1 AS merger FROM invoice_header
        ) AS t1
        JOIN (
          SELECT t2.id AS product_id, t1.description, t1.price, t1.quantity, 1 AS merger FROM products_data AS t1
          LEFT JOIN products_rows AS t2 ON t1.code = t2.code
        ) AS t2 ON t1.merger = t2.merger
      RETURNING *
    )

    SELECT * FROM invoice_rows
  `);

  console.log(r1.rows);

  // const r1 = await knex.raw(`
  //   WITH
  //   customer AS (

  //   )
  //   header AS (
  //     INSERT INTO invoices_headers
  //     (customer_name) VALUES ('foo')
  //     RETURNING id
  //   ),
  //   rows AS (
  //     INSERT INTO invoices_rows
  //     (invoice_header_id) VALUES ((SELECT id FROM header))
  //     RETURNING *
  //   )
  //   SELECT * FROM header
  // `)

  // console.log(r1.rows)
};
