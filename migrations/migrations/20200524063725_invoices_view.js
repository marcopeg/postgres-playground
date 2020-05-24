exports.up = async (knex) => {
  await knex.raw(`DROP VIEW IF EXISTS public.invoices_docs_view`);
  await knex.raw(`
    CREATE VIEW public.invoices_docs_view AS
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
};

exports.down = async (knex) => {
  await knex.raw(`DROP VIEW IF EXISTS public.invoices_docs_view`);
  // await knex.schema.withSchema('public').dropTableIfExists('invoices_headers');
};
