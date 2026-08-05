alter table submissions add column if not exists confirmed_at timestamptz;

create table if not exists submission_confirmations (
  id             bigint generated always as identity primary key,
  submission_id  bigint not null references submissions(id) on delete cascade,
  token_hash     text   not null unique,
  email          text   not null,
  expires_at     timestamptz not null,
  sent_at        timestamptz,
  send_error     text,
  provider_message_id text,
  confirmed_at   timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists submission_confirmations_submission_id_idx
  on submission_confirmations (submission_id);

create index if not exists submissions_confirmed_at_idx
  on submissions (confirmed_at)
  where confirmed_at is not null;

alter table submission_confirmations enable row level security;

create policy "staff select confirmations" on submission_confirmations
  for select to authenticated using (true);
