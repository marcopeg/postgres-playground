exports.up = async (knex) => {
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
  await knex.raw(`
    DROP TRIGGER IF EXISTS tg_refresh_mv_invoices_docs_from_contacts ON public.contacts;
    DROP TRIGGER IF EXISTS tg_refresh_mv_invoices_docs_from_products ON public.products;
    DROP TRIGGER IF EXISTS tg_refresh_mv_invoices_docs_from_invoices_headers ON public.invoices_headers;
    DROP TRIGGER IF EXISTS tg_refresh_mv_invoices_docs_from_invoices_rows ON public.invoices_rows;
  `);
  await knex.raw(`DROP FUNCTION IF EXISTS tg_refresh_mv_invoices_docs`);
};
