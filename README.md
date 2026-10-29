# Inventory System

Need to install following for this repository:

- Node.js version 20 or above
- PNPM or NPM
- Docker and Docker-Compose
- Sequelize cli

## Steps to run in production mode

```
  pnpm install
  pnpm build
  pnpm start
```

##### Instructions for development server

Clone this repository:

```sh
git clone https://github.com/hammadtariq/inventory-system-nextjs.git
```

Install sequelize-cli globally

```sh
sudo yarn global add sequelize-cli
# or
sudo npm i sequelize-cli -g
```

Install `Docker` and `Docker-Compose` for Potsgres Database\
[Get Docker](https://docs.docker.com/get-docker/)

Create `.env` file in root directory for environment variables

```sh
.env
```

Write environment variables in .env file

```sh
POSTGRES_DB=databasename
POSTGRES_USER=username
POSTGRES_PASSWORD=password
TOKEN_SECRET=minimum-32-characters-long-token-secret
```

Setup postgres locally

```sh
brew install postgres
psql postgres # enter in psql terminal for first time
create database "databasename";
create user myuser with encrypted password 'postgres';
grant all privileges on database "databasename" to myuser;
```

OR

Run the following command to create postgres container

```sh
docker-compose up -d
```

It will create docker container for postgres and docker volume to persist the data locally

Now install project dependencies

```sh
yarn install
# or
npm install
```

Run migrations for first time

```sh
npm install -g sequelize-cli
sequelize db:migrate:undo:all
sequelize db:migrate
sequelize db:seed:all
```

Create migration file

```sh
sequelize migration:generate --name <migration-name>
# Example: sequelize migration:generate --name add-is-active-to-users
```

Finally, start the development server:

```sh
yarn dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## QA workflow (QA Kit)

E2E tests live in `e2e/` and are written with the QA Kit plugin for Claude Code. Cases are tracked in TestRail.

Before you start: point `.env` at the local database (never Supabase), seed it with `pnpm db:seed-demo-org`,
and run the app with `pnpm dev -p 3100`.

For each feature, run these in Claude Code:

1. `/qa-kit:plan-feature specs/briefs/<feature>.md` writes the test cases to `specs/cases/<feature>.csv`.
2. `/qa-kit:review-cases specs/cases/<feature>.csv` (optional) suggests cases to merge or drop.
3. Open the CSV, fill the `decision` column (`Keep`, `Drop`, ...) and export it back as CSV.
4. `/qa-kit:push-cases specs/cases/<feature>.csv` sends the kept cases to TestRail.
5. Approve the cases in TestRail.
6. `/qa-kit:generate-tests specs/cases/<feature>.csv` writes the Playwright tests and opens a PR for review.

Other commands:

- `/qa-kit:triage` explains why tests failed.
- `/qa-kit:digest` shows what is waiting for review.
- `/qa-kit:upkeep` is a weekly check for coverage gaps and flaky tests.

Run the tests:

```bash
npx playwright test
npx playwright test --grep @smoke
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## create Models from sequelize cli

sequelize model:generate --name Sale --attributes customerId:integer,totalAmount:float,soldProducts:string

## alter Purchase Order Table

1. ALTER TABLE public.purchases
   ADD COLUMN "revisionDetails" JSONB;

2. ALTER TABLE public.purchases
   ADD COLUMN "revisionNo" INTEGER NOT NULL DEFAULT 0;

## Create PurchaseHistory Table

CREATE TYPE "status_enum" AS ENUM ('PENDING', 'APPROVED', 'CANCEL');
CREATE TYPE "bale_type_enum" AS ENUM ('SMALL_BALES', 'BIG_BALES');

CREATE TABLE "purchase_histories" (
"id" SERIAL PRIMARY KEY,
"purchaseId" INTEGER NOT NULL REFERENCES "purchases"("id") ON DELETE CASCADE,
"companyId" INTEGER NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
"totalAmount" FLOAT NOT NULL,
"surCharge" FLOAT,
"invoiceNumber" VARCHAR,
"purchasedProducts" JSONB NOT NULL,
"revisionDetails" JSONB,
"revisionNo" INTEGER NOT NULL DEFAULT 0,
"status" "status_enum",
"baleType" "bale_type_enum",
"purchaseDate" TIMESTAMP NOT NULL,
"createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
"updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

## Restore Backup

Run these as the local **superuser**, not `postgres`. The RLS migration (`20260430121000-demote-app-role-for-rls.js`) strips `SUPERUSER`/`BYPASSRLS` from the role that ran migrations, so `postgres` can no longer create databases, and `pg_restore` as `postgres` fails on tables with `FORCE ROW LEVEL SECURITY`. On Homebrew Postgres the superuser is your macOS user, so omit `-U`.

```bash
# 1. Recreate the database, owned by postgres (the role the app connects as)
psql -d postgres <<'SQL'
DROP DATABASE IF EXISTS "inventory-management-local";
CREATE DATABASE "inventory-management-local" OWNER postgres;
SQL

# 2a. Custom-format dump (pg_dump -Fc)
pg_restore -d inventory-management-local -v --no-privileges \
  ~/Documents/inventory-backups/inventory_backup_28_10_26

# 2b. Plain SQL dump (pg_dump -f backup.sql, as in "Take backup from Supabase" below)
psql -d inventory-management-local -f ~/Documents/inventory-backups/backup.sql

# 3. Verify
psql -U postgres -d inventory-management-local -c 'select count(*) from "SequelizeMeta";' -c '\dt'
```

Notes:

- Don't pass `--no-owner`: the dump sets the tables' owner to `postgres`, which is what lets the app read and write them.
- Errors about Supabase-only roles or extensions (`supabase_admin`, `anon`, `authenticated`, `pg_graphql`, …) are harmless.
- Don't give `postgres` `SUPERUSER`/`BYPASSRLS` back to make this easier. That turns off RLS tenant isolation locally. `ALTER ROLE postgres CREATEDB;` is fine.
- `SequelizeMeta` is part of the dump. Run `pnpm db:migrate` afterwards only to apply migrations newer than the backup.

## Restore Backup to Supabase

This **replaces all production data** with the backup. Supabase won't let you drop the `postgres` database, so you drop and recreate the `public` schema instead. Each command prompts for the Supabase password.

```bash
SUPA="postgresql://postgres.rbkipyssjjpenpohpiyl@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"

# 1. Safety backup of the current Supabase data (step 2 can't be undone)
pg_dump "$SUPA" -Fc --schema=public -f ~/Documents/inventory-backups/supabase_pre_restore_<dd_mm_yy>.dump

# 2. Drop all existing data, then restore the standard Supabase grants
psql "$SUPA" <<'SQL'
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role;
SQL

# 3. Restore the backup (all-or-nothing)
pg_restore -d "$SUPA" -v --no-owner --no-privileges --single-transaction \
  ~/Documents/inventory-backups/inventory_backup_28_10_26

# 4. Verify: all tables present, orgs/users loaded, RLS on the 10 tenant tables
psql "$SUPA" -c '\dt' \
  -c 'select count(*) as orgs from organizations;' \
  -c 'select count(*) as users from users;' \
  -c 'select max(name) as latest_migration from "SequelizeMeta";' \
  -c "select tablename, rowsecurity from pg_tables where schemaname='public' order by 1;"
```

Notes:

- If step 3 fails, nothing is applied (`--single-transaction`). Restore the step 1 safety dump with the same `pg_restore` command.
- Make sure nothing is writing to Supabase during the restore (deployed app, staff). Writes made after step 1 are lost.
- If step 4's latest migration is older than the newest file in `migrations/`, run the Supabase migration command in `CLAUDE.md` ("Running migrations against Supabase").

## Take backup from Supabase

Custom-format dump of the app's `public` schema, restorable with the steps above. It prompts for the Supabase password, or reads it from `~/.pgpass`.

```bash
pg_dump "postgresql://postgres.rbkipyssjjpenpohpiyl@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require" \
  -Fc --schema=public -v \
  -f ~/Documents/inventory-backups/supabase_backup_$(date +%d_%m_%y).dump

# Verify: should print at least 15
pg_restore -l ~/Documents/inventory-backups/supabase_backup_$(date +%d_%m_%y).dump | grep -c "TABLE DATA"
```

`pg_dump` must be at least Supabase's Postgres major version. On a "server version mismatch" error, run `brew upgrade postgresql`.

## Automated weekly backup to Google Drive

`.github/workflows/supabase-backup.yml` runs every Sunday at 02:00 PKT. It dumps Supabase with the command above, checks the dump, and uploads `supabase_backup_<dd_mm_yy>.dump` to the backups folder on Google Drive. To run it on demand: Actions → "Supabase weekly backup" → Run workflow, or `gh workflow run supabase-backup.yml`.

The repo is public, so the dump is never attached to the workflow run, and all connection details are repo secrets:

| Secret             | Value                                                                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SUPABASE_DB_URL`  | `postgresql://postgres.rbkipyssjjpenpohpiyl:<password>@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require` (URL-encode special characters in the password) |
| `GDRIVE_TOKEN`     | JSON printed by `rclone authorize "drive"` (run locally after `brew install rclone`, sign in with the Google account that owns the folder)                                     |
| `GDRIVE_FOLDER_ID` | The id from the folder URL, `https://drive.google.com/drive/folders/<id>`                                                                                                      |

- **When the Supabase password changes**, update `SUPABASE_DB_URL` along with Vercel and `.env`.
- **Failures** are emailed to whoever last edited the workflow file.
- **To restore from Drive**, download the file and follow "Restore Backup to Supabase" or "Restore Backup".
- **Keep the Drive folder restricted** to named people, not "Anyone with the link". It holds full copies of production data.
- **GitHub disables scheduled workflows in public repos after 60 days with no commits.** If backups stop, re-enable the workflow under Actions.
