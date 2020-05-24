exports.up = async (knex) => {
  await knex.raw(`DROP MATERIALIZED VIEW IF EXISTS public.invoices_docs`);
  await knex.raw(`
    CREATE MATERIALIZED VIEW public.invoices_docs AS
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

  await knex.raw(`
    CREATE OR REPLACE FUNCTION tg_refresh_mv_invoices_docs()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
        REFRESH MATERIALIZED VIEW invoices_docs;
        RETURN NULL;
    END;
    $$;
  `);

  await knex.raw(`
    CREATE TRIGGER tg_refresh_mv_invoices_docs_from_contacts AFTER INSERT OR UPDATE OR DELETE
    ON public.contacts
    FOR EACH STATEMENT EXECUTE PROCEDURE tg_refresh_mv_invoices_docs();
  `);

  await knex.raw(`
    CREATE TRIGGER tg_refresh_mv_invoices_docs_from_products AFTER INSERT OR UPDATE OR DELETE
    ON public.products
    FOR EACH STATEMENT EXECUTE PROCEDURE tg_refresh_mv_invoices_docs();
  `);

  await knex.raw(`
    CREATE TRIGGER tg_refresh_mv_invoices_docs_from_invoices_headers AFTER INSERT OR UPDATE OR DELETE
    ON public.invoices_headers
    FOR EACH STATEMENT EXECUTE PROCEDURE tg_refresh_mv_invoices_docs();
  `);

  await knex.raw(`
    CREATE TRIGGER tg_refresh_mv_invoices_docs_from_invoices_rows AFTER INSERT OR UPDATE OR DELETE
    ON public.invoices_rows
    FOR EACH STATEMENT EXECUTE PROCEDURE tg_refresh_mv_invoices_docs();
  `);
};

exports.down = async (knex) => {
  await knex.raw(`DROP MATERIALIZED VIEW IF EXISTS public.invoices_docs`);
  await knex.raw(`
    DROP TRIGGER IF EXISTS tg_refresh_mv_invoices_docs_from_contacts ON public.contacts;
    DROP TRIGGER IF EXISTS tg_refresh_mv_invoices_docs_from_products ON public.products;
    DROP TRIGGER IF EXISTS tg_refresh_mv_invoices_docs_from_invoices_headers ON public.invoices_headers;
    DROP TRIGGER IF EXISTS tg_refresh_mv_invoices_docs_from_invoices_rows ON public.invoices_rows;
  `);
  await knex.raw(`DROP FUNCTION IF EXISTS tg_refresh_mv_invoices_docs`);
};
