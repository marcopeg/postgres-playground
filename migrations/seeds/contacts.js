exports.seed = async knex => {
  await knex('contacts').del();

  // Simple insert
  const r1 = await knex.raw(`
    INSERT INTO public.contacts
    (name, city) VALUES ('marco', 'vicenza')
    RETURNING *
  `);
  console.log(r1.rows);

  // Upsert: insert OR update
  const r2 = await knex.raw(`
    INSERT INTO public.contacts AS t1
      (name, city)
    VALUES
      ('marco', 'malmö')
    ON CONFLICT (name)
    DO UPDATE SET
      city = EXCLUDED.city,                 -- Use a value from the provided data
      updates_count = t1.updates_count + 1, -- Use a value from the existing record
      updated_at = NOW()                    -- Provide an arbitrary value
    RETURNING *
  `);
  console.log(r2.rows);
};
