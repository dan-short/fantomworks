alter table submissions add column if not exists status_changed_at timestamptz;

create or replace function public.set_status_changed_at() returns trigger as $$
begin
  if new.status is distinct from old.status then
    new.status_changed_at = now();
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists submissions_set_status_changed_at on submissions;
create trigger submissions_set_status_changed_at
  before update on submissions
  for each row execute function public.set_status_changed_at();

alter table submissions disable trigger submissions_set_updated_at;

update submissions
   set status_changed_at = coalesce(updated_at, received_date::timestamptz)
 where status_changed_at is null;

alter table submissions enable trigger submissions_set_updated_at;

alter table submissions alter column status_changed_at set default now();

create index if not exists submissions_archived_recent_idx
  on submissions (bumped_at desc nulls last, status_changed_at desc nulls last, received_date desc nulls last)
  where status = 'archived';
