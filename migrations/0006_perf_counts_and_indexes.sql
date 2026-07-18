-- Performance pass for the Call Log console.
--
-- The console re-runs three things on every navigation (tab / sort / search /
-- page): the paged row query, the per-page detail-stage batch, and the pipeline
-- tab counts. This migration targets the two that scaled badly:
--
--   1. Pipeline tab counts. The app used to `select status` for EVERY row
--      (~5,900) and tally them in Node on each load. Replaced by a single
--      grouped aggregate exposed as an RPC (one small round-trip).
--   2. Sorted + paged reads. The old indexes didn't match the real ORDER BYs
--      (bumped-then-received, distance, year, name), so sorted pages fell back
--      to a full sort. Added composite indexes per sort key.
--
-- Idempotent: safe to re-run.

-- ── 1. Pipeline tab counts as one aggregate ────────────────────────────────
-- security invoker so the caller's RLS still applies (authenticated staff only,
-- per migration 0002). Returns one row per status actually present.
create or replace function public.submissions_status_counts()
returns table (status submission_status, n bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select status, count(*) from submissions group by status;
$$;

grant execute on function public.submissions_status_counts() to authenticated;

-- ── 2. Indexes matching the console's ORDER BYs (all scoped by status) ──────
-- Default view: bumped rows first (most recent bump), then received_date desc.
create index if not exists submissions_status_bumped_received_idx
  on submissions (status, bumped_at desc nulls last, received_date desc nulls last);

-- Sort: Distance (farthest first).
create index if not exists submissions_status_distance_idx
  on submissions (status, distance_miles desc nulls last);

-- Sort: Vehicle year (oldest first).
create index if not exists submissions_status_year_idx
  on submissions (status, year);

-- Sort: Name (A→Z). Supersedes the plain last_name index for the scoped query.
create index if not exists submissions_status_last_name_idx
  on submissions (status, last_name);

-- ── 3. Search (ILIKE '%term%' across name/email/vehicle/city) ──────────────
-- A leading-wildcard ILIKE can't use a btree index, so search was a seq scan.
-- Trigram GIN indexes let Postgres BitmapOr the per-column ILIKEs instead.
-- Cheap insurance at today's size; the real win is as the table grows.
create extension if not exists pg_trgm;

create index if not exists submissions_first_name_trgm on submissions using gin (first_name gin_trgm_ops);
create index if not exists submissions_last_name_trgm  on submissions using gin (last_name  gin_trgm_ops);
create index if not exists submissions_email_trgm      on submissions using gin (email      gin_trgm_ops);
create index if not exists submissions_make_trgm       on submissions using gin (make       gin_trgm_ops);
create index if not exists submissions_model_trgm      on submissions using gin (model      gin_trgm_ops);
create index if not exists submissions_city_trgm       on submissions using gin (city       gin_trgm_ops);
