-- Bump-to-top ordering, decoupled from received_date.
--
-- The scaffold implemented "bump" by rewriting received_date = today, which
-- destroyed the real received date AND flipped the age color to green. Instead
-- we add a dedicated ordering signal: bumped_at. The default (received) sort
-- becomes: bumped rows first (most-recently-bumped on top), then by real
-- received_date desc. received_date is never mutated by a bump again.

alter table submissions add column if not exists bumped_at timestamptz;

-- Supports the new default ordering within a pipeline view.
create index if not exists submissions_status_bumped_received_idx
  on submissions (status, bumped_at desc nulls last, received_date desc);
