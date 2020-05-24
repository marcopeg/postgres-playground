exports.seed = async (knex) => {
  await knex('contacts').del();
  await knex('products').del();
  await knex('invoices_headers').del();
  await knex('invoices_rows').del();

  // Generate a single invoice with upserted related informations
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

    SELECT * FROM invoice_header
  `);

  await knex.raw(`
    WITH
    invoice_data (name, date) AS (
      VALUES ('lia', '2020-05-22')
    ),
    products_data (code, description, price, quantity) AS (
      VALUES
        ('cra', 'a new product', 50, 7),
        ('br', 'beer', 75, 10)
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

    SELECT * FROM invoice_header
  `);

  // Extract a document based view of the invoices
  const r2 = await knex.raw(`
    SELECT 
      h.id AS invoice_id,
      h.contact_id,
      c.name AS contact_name,
      h.date AS emission_date,
      (
        SELECT SUM(r.price * r.quantity) FROM public.invoices_rows AS r
        WHERE r.invoice_header_id = h.id
      ) AS price_total,
      (
        SELECT array_to_json(array_agg(row_to_json(d)))
        FROM (
          SELECT
            h.id AS invoice_id,
            r.id AS row_id, 
            p.id AS product_id, 
            p.code AS product_code,
            r.description,
            r.quantity,
            r.price AS price_unit,
            r.quantity * r.price AS price_total
          FROM public.invoices_rows AS r
          JOIN public.products AS p ON p.id = r.product_id
          WHERE invoice_header_id = h.id
        ) d
      ) AS products
    FROM public.invoices_headers AS h
    JOIN public.contacts AS c ON c.id = h.contact_id
  `);

  // console.log(r2.rows);
  console.log(JSON.stringify(r2.rows, null, 2));
};
