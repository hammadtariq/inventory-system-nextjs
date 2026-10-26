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

psql -U postgres -d postgres

# Inside PSQL

```
DROP DATABASE IF EXISTS "inventory-management-local";
create database "inventory-management-local";
grant all privileges on database "inventory-management-local" to postgres;
\q
```

pg_restore -U postgres -d inventory-management-local -v ~/Documents/inventory\ backups/inventory_backup_25_06_25

## Take backup from Supabase

```
/opt/homebrew/opt/postgresql@17/bin/pg_dump postgresql://postgres.rbkipyssjjpenpohpiyl:[password]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres -f backup-02-07-26.sql
```
