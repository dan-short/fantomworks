alter table submissions add column if not exists bumped_at timestamptz;

create index if not exists submissions_status_bumped_received_idx
  on submissions (status, bumped_at desc nulls last, received_date desc);
