# postgres-playground
Run some Postgres queries to try out different possible approaches to solutions.

## Migrations

```bash
# Gain access to the migrations shell
humble exec migrations /bin/sh

# Replay all migrations
npx knex migrate:rollback --all && npx knex migrate:latest
```

