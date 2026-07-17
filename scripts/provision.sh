#!/usr/bin/env bash
# Provision the FantomWorks Supabase project: schema -> data -> policies -> verify.
# Reads FANTOM_DB_URL from web/.env (NOT the shell SUPABASE_DB_URL, which points
# at a different project). Safe to re-run: migrations use plain CREATE; the data
# load is wrapped in a transaction and zipcodes use ON CONFLICT DO NOTHING.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DB_URL="$(grep -E '^FANTOM_DB_URL=' "$ROOT/web/.env" | sed -E 's/^FANTOM_DB_URL=//; s/^["'\'']//; s/["'\'']$//')"

if [ -z "${DB_URL}" ]; then
  echo "ERROR: FANTOM_DB_URL not found in web/.env" >&2
  exit 1
fi

# guard: refuse to run against the known 'other' project
if echo "$DB_URL" | grep -q 'euqrytqeiqnhiyqrmpan'; then
  echo "ERROR: FANTOM_DB_URL points at the marketplace project, not FantomWorks. Aborting." >&2
  exit 1
fi

echo "==> Connection check"
psql "$DB_URL" -tAc "select 'ok as ' || current_user"

echo "==> 0001 schema"
psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$ROOT/migrations/0001_initial_schema.sql"

echo "==> data load (this is the big one)"
psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$ROOT/exports/converted/supabase_load.sql"

echo "==> 0002 RLS policies"
psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$ROOT/migrations/0002_rls_policies.sql"

echo "==> verify"
psql "$DB_URL" -c "select status, count(*) from submissions group by status order by count(*) desc;"
psql "$DB_URL" -c "select count(*) as detail_stages from submission_detail_stages;"
psql "$DB_URL" -c "select count(*) as zipcodes from zipcodes;"
echo "==> done"
