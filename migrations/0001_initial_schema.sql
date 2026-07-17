-- FantomWorks call log — Postgres schema (Supabase), v2.
-- Rebuilt from the REAL dump (exports/fantomwo_call_log.sql), not a guess.
--
-- Source tables: Project_Submissions (1,395) + Project_Submissions_Archive (4,504)
-- are unified into `submissions` (identical columns; 10 legacy-ID collisions, so we
-- use a surrogate PK and keep legacy_id + source). Project_Desc (6,423) becomes the
-- normalized `submission_detail_stages`. ZipCodes (43,633) is a reference table.
--
-- Cleaning applied by scripts/convert.mjs before load:
--   * HTML entities decoded (&rsquo; &amp; &#039; ...), latin1/utf8 mojibake repaired
--   * ZipCode int -> zero-padded text (restores 08044, 04662, ...)
--   * Budget text -> numeric; '1900-01-01' sentinel dates -> NULL
--   * status derived from the legacy flag columns (raw flags kept for fidelity)

create type submission_status as enum (
  'new',       -- all pipeline flags 0 -> the working Call Log
  'pending',
  'active',    -- Confirmed / Confirmed_Coming_In / Confirmed_Here
  'finished',  -- Confirmed_Finished
  'possible',  -- Office
  'archived',  -- Archived
  'deleted'    -- Deleted (spam/rejected)
);

create table submissions (
  id            bigint generated always as identity primary key,
  legacy_id     bigint not null,
  source        text   not null check (source in ('live', 'archive')),

  -- customer
  first_name    text,
  last_name     text,
  phone         text,
  alt_phone     text,
  call_schedule text,
  email         text,

  -- location
  street        text,
  zipcode       text,               -- zero-padded, cleaned
  city          text,
  state_country text,
  time_zone     text,
  distance_miles integer,

  -- vehicle / project
  year          text,
  make          text,
  model         text,
  budget        numeric,            -- parsed from legacy varchar
  project_start text,
  project_description text,

  -- policy acknowledgements / misc legacy fields
  parts_policies              text,
  guarantee_warranty_policies text,
  storage_fees_policies       text,
  paint_changes_everything    text,
  estimate_terms              text,
  restoration_decision_matrix text,

  -- workflow
  status        submission_status not null default 'new',
  received_date date,
  original_date date,
  arrival_date  date,
  added_by      text,
  notes         text,

  -- contact attempts (legacy stored as varchar: dates, staff initials, or blank)
  call_attempt_one   text,
  call_attempt_two   text,
  call_attempt_three text,
  email_attempt      text,

  -- images (filenames today; migrate to Supabase Storage in Phase 2)
  image_name_1 text,
  image_name_2 text,
  image_name_3 text,
  image_name_4 text,

  -- raw legacy flags, kept lossless (status above is derived from these)
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

-- Normalized project breakdown: one row per non-empty stage of Project_Desc.
-- (Project_Desc had 13 stages × {Desc, Parts$, Hours} as 39 wide columns.)
create table submission_detail_stages (
  id            bigint generated always as identity primary key,
  submission_id bigint not null references submissions(id) on delete cascade,
  stage_key     text not null,   -- dis, media, fab, chassis, drive, assem, test, body, paint, elec, int, ext, wring
  stage_label   text not null,
  description   text,
  parts_cost    integer,
  hours         integer,
  sort_order    smallint not null
);

create table zipcodes (
  zip_code  text primary key,   -- zero-padded
  latitude  double precision,
  longitude double precision
);

create index submissions_status_received_idx on submissions (status, received_date desc);
create index submissions_last_name_idx        on submissions (last_name);
create index detail_stages_submission_idx      on submission_detail_stages (submission_id);

-- updated_at trigger
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger submissions_set_updated_at
  before update on submissions
  for each row execute function set_updated_at();

-- RLS: locked down; authenticated staff get full access (policies added with Auth setup).
alter table submissions             enable row level security;
alter table submission_detail_stages enable row level security;
