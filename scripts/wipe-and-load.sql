\set ON_ERROR_STOP on
begin;

create temp table _zip_geo on commit drop as
  select zip_code, city, state from zipcodes where city is not null or state is not null;

truncate submissions, zipcodes restart identity cascade;

\copy submissions (legacy_id, source, first_name, last_name, phone, alt_phone, call_schedule, email, street, zipcode, city, state_country, time_zone, distance_miles, year, make, model, budget, project_start, project_description, parts_policies, guarantee_warranty_policies, storage_fees_policies, paint_changes_everything, estimate_terms, restoration_decision_matrix, status, received_date, original_date, arrival_date, added_by, notes, call_attempt_one, call_attempt_two, call_attempt_three, email_attempt, image_name_1, image_name_2, image_name_3, image_name_4, legacy_archived, legacy_pending, legacy_pending_status, legacy_confirmed, legacy_confirmed_coming_in, legacy_confirmed_here, legacy_confirmed_finished, legacy_deleted, legacy_office) from 'exports/converted/submissions.csv' with (format csv, header true, null '');

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

update zipcodes z set city = g.city, state = g.state
from _zip_geo g where g.zip_code = z.zip_code;

do $$
begin
  if to_regclass('public.submissions_new_legacy_id_seq') is not null then
    perform setval('submissions_new_legacy_id_seq', (select coalesce(max(legacy_id), 0) from submissions), true);
  end if;
end $$;

commit;
