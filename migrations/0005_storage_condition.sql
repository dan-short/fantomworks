alter table submissions
  add column if not exists storage_type  text,
  add column if not exists storage_years numeric;

comment on column submissions.storage_type  is 'Most recent storage condition (dropdown; free text for "Other").';
comment on column submissions.storage_years is 'Years the vehicle has been in that storage condition.';
