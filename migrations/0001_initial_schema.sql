create type submission_status as enum (
  'new',
  'pending',
  'active',
  'finished',
  'possible',
  'archived',
  'deleted'
);

create table submissions (
  id            bigint generated always as identity primary key,
  legacy_id     bigint not null,
  source        text   not null check (source in ('live', 'archive')),

  first_name    text,
  last_name     text,
  phone         text,
  alt_phone     text,
  call_schedule text,
  email         text,

  street        text,
  zipcode       text,
  city          text,
  state_country text,
  time_zone     text,
  distance_miles integer,

  year          text,
  make          text,
  model         text,
  budget        numeric,
  project_start text,
  project_description text,

  parts_policies              text,
  guarantee_warranty_policies text,
  storage_fees_policies       text,
  paint_changes_everything    text,
  estimate_terms              text,
  restoration_decision_matrix text,

  status        submission_status not null default 'new',
  received_date date,
  original_date date,
  arrival_date  date,
  added_by      text,
  notes         text,

  call_attempt_one   text,
  call_attempt_two   text,
  call_attempt_three text,
  email_attempt      text,

  image_name_1 text,
  image_name_2 text,
  image_name_3 text,
  image_name_4 text,

  legacy_archived         boolean default false,
  legacy_pending          integer default 0,
  legacy_pending_status   integer default 0,
  legacy_confirmed        integer default 0,
  legacy_confirmed_coming_in integer default 0,
  legacy_confirmed_here   integer default 0,
  legacy_confirmed_finished integer default 0,
  legacy_deleted          boolean default false,
  legacy_office           integer default 0,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (legacy_id, source)
);

create table submission_detail_stages (
  id            bigint generated always as identity primary key,
  submission_id bigint not null references submissions(id) on delete cascade,
  stage_key     text not null,
  stage_label   text not null,
  description   text,
  parts_cost    integer,
  hours         integer,
  sort_order    smallint not null
);

create table zipcodes (
  zip_code  text primary key,
  latitude  double precision,
  longitude double precision
);

create index submissions_status_received_idx on submissions (status, received_date desc);
create index submissions_last_name_idx        on submissions (last_name);
create index detail_stages_submission_idx      on submission_detail_stages (submission_id);

create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger submissions_set_updated_at
  before update on submissions
  for each row execute function set_updated_at();

alter table submissions             enable row level security;
alter table submission_detail_stages enable row level security;
