const knex = require('knex')({
  client: 'pg',
  connection: {
    host: 'postgres',
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
  },
});

const boot = async () => {
  const time = await knex.raw('SELECT NOW() AS time');
  console.info(`> ${time.rows[0].time}`);

  await knex.raw('drop schema public cascade; create schema public;');

  console.info('> Create DB Schema:');
  await knex.migrate.rollback();
  await knex.migrate.latest();

  console.info('> Seed invoices:');
  await knex.seed.run({
    specific: 'invoices.js',
  });
};

boot()
  .then(() => console.log('> boot completed'))
  .catch((err) => console.error(err));
