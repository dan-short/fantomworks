#!/usr/bin/env bash
# Fast COPY load into an already-migrated FantomWorks DB, then apply RLS + verify.
# Assumes migrations/0001 already ran (tables exist). Reads FANTOM_DB_URL from web/.env.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" # so \copy relative paths in fast-load.sql resolve
DB_URL="$(grep -E '^FANTOM_DB_URL=' web/.env | sed -E 's/^FANTOM_DB_URL=//; s/^["'\'']//; s/["'\'']$//')"

if [ -z "${DB_URL}" ]; then echo "ERROR: FANTOM_DB_URL missing in web/.env" >&2; exit 1; fi
if echo "$DB_URL" | grep -q 'euqrytqeiqnhiyqrmpan'; then
  echo "ERROR: FANTOM_DB_URL points at the marketplace project. Aborting." >&2; exit 1
fi

echo "==> fast COPY load"
time psql "$DB_URL" -v ON_ERROR_STOP=1 -f scripts/fast-load.sql

echo "==> RLS policies (idempotent-ish: errors if already applied)"
psql "$DB_URL" -v ON_ERROR_STOP=1 -f migrations/0002_rls_policies.sql || echo "(policies may already exist — continuing)"

echo "==> verify"
psql "$DB_URL" -c "select status, count(*) from submissions group by status order by count(*) desc;"
psql "$DB_URL" -c "select count(*) as detail_stages from submission_detail_stages;"
psql "$DB_URL" -c "select count(*) as zipcodes from zipcodes;"
echo "==> done"
