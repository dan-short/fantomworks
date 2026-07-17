-- Vehicle storage condition — how the car has been kept most recently, and for
-- how many years in that condition. Captured on both submission forms and
-- editable in the Call Log.
--
-- storage_type is free text backed by a fixed dropdown in the UI (see
-- lib/form-utils.ts STORAGE_OPTIONS); "Other" lets staff/customers write their own.

alter table submissions
  add column if not exists storage_type  text,
  add column if not exists storage_years numeric;

comment on column submissions.storage_type  is 'Most recent storage condition (dropdown; free text for "Other").';
comment on column submissions.storage_years is 'Years the vehicle has been in that storage condition.';
