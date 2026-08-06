
create table if not exists email_templates (
  id               bigint generated always as identity primary key,
  slug             text not null unique,
  label            text not null,
  blurb            text not null default '',
  template_group   text not null default 'Move forward',
  subject          text not null default '',
  header           text not null default '',
  body             text not null default '',
  footer           text not null default '',
  suggested_status text,
  sort_order       int  not null default 0,
  archived_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  updated_by       text
);

create index if not exists email_templates_active_idx
  on email_templates (sort_order)
  where archived_at is null;

create table if not exists submission_emails (
  id                  bigint generated always as identity primary key,
  submission_id       bigint not null references submissions(id) on delete cascade,
  template_slug       text,
  template_label      text,
  to_email            text not null,
  from_email          text not null,
  subject             text not null,
  header              text not null default '',
  body                text not null default '',
  footer              text not null default '',
  body_text           text not null default '',
  provider_message_id text,
  send_error          text,
  sent_at             timestamptz,
  sent_by             text,
  status_applied      text,
  created_at          timestamptz not null default now()
);

create index if not exists submission_emails_submission_id_idx
  on submission_emails (submission_id, created_at desc);

alter table email_templates enable row level security;
alter table submission_emails enable row level security;

drop policy if exists "staff read templates" on email_templates;
create policy "staff read templates" on email_templates
  for select to authenticated using (true);

drop policy if exists "staff write templates" on email_templates;
create policy "staff write templates" on email_templates
  for all to authenticated using (true) with check (true);

drop policy if exists "staff read sent emails" on submission_emails;
create policy "staff read sent emails" on submission_emails
  for select to authenticated using (true);

drop policy if exists "staff write sent emails" on submission_emails;
create policy "staff write sent emails" on submission_emails
  for all to authenticated using (true) with check (true);
