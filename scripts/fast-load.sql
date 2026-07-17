-- Fast bulk load via COPY (streams each table in one round-trip vs. row-by-row INSERTs).
-- Run from the repo root so the \copy relative paths resolve. Atomic: all-or-nothing.
\set ON_ERROR_STOP on
begin;

\copy submissions (legacy_id, source, first_name, last_name, phone, alt_phone, call_schedule, email, street, zipcode, city, state_country, time_zone, distance_miles, year, make, model, budget, project_start, project_description, parts_policies, guarantee_warranty_policies, storage_fees_policies, paint_changes_everything, estimate_terms, restoration_decision_matrix, status, received_date, original_date, arrival_date, added_by, notes, call_attempt_one, call_attempt_two, call_attempt_three, email_attempt, image_name_1, image_name_2, image_name_3, image_name_4, legacy_archived, legacy_pending, legacy_pending_status, legacy_confirmed, legacy_confirmed_coming_in, legacy_confirmed_here, legacy_confirmed_finished, legacy_deleted, legacy_office) from 'exports/converted/submissions.csv' with (format csv, header true, null '');

-- stage rows carry legacy_id + source so we can resolve the generated submission id
create temp table _stage_import (
  legacy_id bigint, source text, stage_key text, stage_label text,
  description text, parts_cost integer, hours integer, sort_order smallint
) on commit drop;

\copy _stage_import (legacy_id, source, stage_key, stage_label, description, parts_cost, hours, sort_order) from 'exports/converted/detail_stages.csv' with (format csv, header true, null '');

insert into submission_detail_stages (submission_id, stage_key, stage_label, description, parts_cost, hours, sort_order)
select s.id, i.stage_key, i.stage_label, i.description, i.parts_cost, i.hours, i.sort_order
from _stage_import i
join submissions s on s.legacy_id = i.legacy_id and s.source = i.source;

\copy zipcodes (zip_code, latitude, longitude) from 'exports/converted/zipcodes.csv' with (format csv, header true, null '');

commit;
