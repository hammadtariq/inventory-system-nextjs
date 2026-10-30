#!/usr/bin/env bash
# QA Kit: prepare the app for E2E in CI. Called by .github/actions/qa-app-setup after dependencies
# are installed. Keep it idempotent and quiet.
#
# Migrates and seeds a throwaway Postgres (the job's `postgres` service on port 5432, user/password
# postgres) with the demo organization, exports the test logins and builds the app.
# Anything written to "$GITHUB_ENV" is visible to the test steps (mask secrets with ::add-mask::).
set -euo pipefail

if [ -n "${BASE_URL:-}" ]; then
  echo "BASE_URL is set: testing a deployed environment, no local app setup."
  exit 0
fi

export PGPASSWORD=postgres
# The app role must not be the bootstrap superuser: the RLS migration demotes the role it runs as.
psql -h localhost -U postgres -c "CREATE ROLE qa_app LOGIN SUPERUSER PASSWORD 'qa_app';"
psql -h localhost -U postgres -c "CREATE DATABASE inventory_qa OWNER qa_app;"

# Throwaway passwords for the seeded logins (no repository secrets needed: the database is discarded).
PASS="Qa-$(openssl rand -hex 12)"
WAREHOUSE_PASS="Qa-$(openssl rand -hex 12)"
SALES_PASS="Qa-$(openssl rand -hex 12)"
echo "::add-mask::$PASS"
echo "::add-mask::$WAREHOUSE_PASS"
echo "::add-mask::$SALES_PASS"
TOKEN_SECRET="$(openssl rand -hex 32)"
{
  echo "POSTGRES_HOST=localhost"
  echo "POSTGRES_PORT=5432"
  echo "POSTGRES_USER=qa_app"
  echo "POSTGRES_PASSWORD=qa_app"
  echo "POSTGRES_DB=inventory_qa"
  echo "TOKEN_SECRET=$TOKEN_SECRET"
  echo "NEXT_TELEMETRY_DISABLED=1"
  echo "QA_USER_EMAIL=admin@trs.com"
  echo "QA_USER_PASSWORD=$PASS"
  echo "DEMO_ADMIN_PASSWORD=$PASS"
  echo "DEMO_EDITOR_WAREHOUSE_PASSWORD=$WAREHOUSE_PASS"
  echo "DEMO_EDITOR_SALES_PASSWORD=$SALES_PASS"
} >> "$GITHUB_ENV"

# $GITHUB_ENV only reaches later steps; this script's own commands need the values now.
export POSTGRES_HOST=localhost POSTGRES_PORT=5432 POSTGRES_USER=qa_app POSTGRES_PASSWORD=qa_app \
  POSTGRES_DB=inventory_qa TOKEN_SECRET NEXT_TELEMETRY_DISABLED=1 DEMO_ADMIN_PASSWORD="$PASS" \
  DEMO_EDITOR_WAREHOUSE_PASSWORD="$WAREHOUSE_PASS" DEMO_EDITOR_SALES_PASSWORD="$SALES_PASS"

pnpm db:migrate > /tmp/migrate.log 2>&1 || { tail -50 /tmp/migrate.log; exit 1; }
pnpm db:seed-demo-org > /tmp/seed.log 2>&1 || { tail -50 /tmp/seed.log; exit 1; }
grep -q "seeded successfully" /tmp/seed.log && echo "Demo organization seeded."

pnpm build
