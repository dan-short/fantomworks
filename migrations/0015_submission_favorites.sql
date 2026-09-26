create table if not exists submission_favorites (
  user_id       uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  submission_id bigint      not null references submissions (id) on delete cascade,
  saved_at      timestamptz not null default now(),
  primary key (user_id, submission_id)
);

create index if not exists submission_favorites_submission_id_idx
  on submission_favorites (submission_id);

alter table submission_favorites enable row level security;

drop policy if exists "staff read own favorites" on submission_favorites;
create policy "staff read own favorites" on submission_favorites
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "staff add own favorites" on submission_favorites;
create policy "staff add own favorites" on submission_favorites
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "staff remove own favorites" on submission_favorites;
create policy "staff remove own favorites" on submission_favorites
  for delete to authenticated using (user_id = (select auth.uid()));
