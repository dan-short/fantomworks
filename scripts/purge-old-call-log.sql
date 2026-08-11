-- Retires Call Log leads (status = 'new') with a received_date 7+ years old.
-- Run step 1 alone first and confirm the count before running step 2.
-- Rows with a null received_date are never matched and are left untouched.

-- Step 1: preview
select
  count(*)            as affected,
  min(received_date)  as oldest,
  max(received_date)  as newest
from submissions
where status = 'new'
  and received_date < current_date - interval '7 years';

-- Step 1b: eyeball a sample before committing
select id, legacy_id, first_name, last_name, received_date, year, make, model
from submissions
where status = 'new'
  and received_date < current_date - interval '7 years'
order by received_date
limit 25;

-- Step 2: soft delete, matching what the app's Delete button does.
-- Reversible: set status back to 'new' for anything caught by mistake.
update submissions
set status = 'deleted',
    status_changed_at = now()
where status = 'new'
  and received_date < current_date - interval '7 years';

-- Step 2 (alternative): permanent removal. Cascades to submission_emails,
-- submission_detail_stages and submission_confirmations, and orphans any
-- photos in storage. Not reversible without a database backup.
-- delete from submissions
-- where status = 'new'
--   and received_date < current_date - interval '7 years';
