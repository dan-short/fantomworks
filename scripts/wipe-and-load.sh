#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DUMP="${1:-exports/fantomwo_call_log_08_04_26.sql}"
DB_URL="$(grep -E '^FANTOM_DB_URL=' web/.env | sed -E "s/^FANTOM_DB_URL=//; s/^['\"]//; s/['\"]\$//")"

if [ -z "${DB_URL}" ]; then echo "ERROR: FANTOM_DB_URL missing in web/.env" >&2; exit 1; fi
if echo "$DB_URL" | grep -qE 'euqrytqeiqnhiyqrmpan|ezhomesteading'; then
  echo "ERROR: FANTOM_DB_URL points at the ezhomesteading/marketplace project. Aborting." >&2; exit 1
fi
if [ ! -f "$DUMP" ]; then echo "ERROR: dump not found: $DUMP" >&2; exit 1; fi

echo "==> target"
psql "$DB_URL" -tAc "select current_database() || ' @ ' || inet_server_addr();"

MISSING="$(psql "$DB_URL" -tAc "select count(*) from information_schema.tables where table_schema='public' and table_name in ('submissions','submission_detail_stages','zipcodes');")"
if [ "$MISSING" != "3" ]; then
  echo "ERROR: expected 3 core tables, found $MISSING. Run migrations/0001..0008 first." >&2; exit 1
fi

echo "==> current row counts (about to be destroyed)"
psql "$DB_URL" -c "select 'submissions' t, count(*) from submissions union all select 'detail_stages', count(*) from submission_detail_stages union all select 'zipcodes', count(*) from zipcodes;"

read -r -p "Type WIPE to truncate and reload from ${DUMP}: " CONFIRM
[ "$CONFIRM" = "WIPE" ] || { echo "aborted"; exit 1; }

echo "==> converting dump"
node scripts/convert.mjs "$DUMP"

echo "==> wipe + COPY load"
time psql "$DB_URL" -v ON_ERROR_STOP=1 -f scripts/wipe-and-load.sql

echo "==> verify"
psql "$DB_URL" -c "select status, count(*) from submissions group by status order by count(*) desc;"
psql "$DB_URL" -c "select source, count(*) from submissions group by source;"
psql "$DB_URL" -c "select count(*) as detail_stages from submission_detail_stages;"
psql "$DB_URL" -c "select count(*) as zipcodes, count(city) as geocoded from zipcodes;"
psql "$DB_URL" -c "select last_value as legacy_id_seq from submissions_new_legacy_id_seq;"
echo "==> done"
