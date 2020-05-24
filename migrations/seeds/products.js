exports.seed = async (knex) => {
  await knex('products').del();

  // Insert a single product
  await knex.raw(`
    INSERT INTO public.products (code, description, price) VALUES ('lfb', 'loafs of bread', 10)
  `);

  // Upsert a list of products with code and description,
  // add new products, update existing,
  // and match an external integer key with additional informations
  // that are added row by row
  const r2 = await knex.raw(`
    WITH
    -- Input data, those may be invoice's rows that refer to a product
    -- The "code" is our external unique id
    products_data (code, description, price, quantity) AS (
      VALUES
        ('lfb', 'loafs of bread', 250, 20),
        ('lfb', 'loafs of bread', 150, 10),
        ('br', 'beer', 100, 10)
    ),
    -- Retrieve the product's internal id, used for normalized data
    -- Here we only want to grab the ID, we don't really care updating the record
    -- but in case the product didn't exists, it's going to be created
    products_rows AS (
      INSERT INTO public.products AS t1
        (code, description, price)
        SELECT DISTINCT ON (code) code, description, price FROM products_data
      ON CONFLICT (code)
      DO UPDATE SET created_at = t1.created_at
      RETURNING *
    )
    SELECT t2.id, t2.code, t1.description, t1.price, t1.quantity FROM products_data AS t1
    LEFT JOIN products_rows AS t2 ON t1.code = t2.code
  `);
  console.log(r2.rows);
};
