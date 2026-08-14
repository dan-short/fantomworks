drop function if exists public.submissions_search(text, text, text[], text, int, int, boolean, boolean);

create or replace function public.submissions_search(
  q          text,
  cur_status text    default 'new',
  statuses   text[]  default array['new','pending','active','finished','possible','archived'],
  sort_key   text    default 'relevance',
  sort_dir   text    default 'desc',
  lim        int     default 25,
  off        int     default 0,
  incl_desc  boolean default false,
  incl_tasks boolean default false
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public, extensions
as $$
declare
  cat_order text[] := array['new','pending','active','finished','possible','archived'];
  result    jsonb;
begin
  if cur_status is not null and cur_status = any (cat_order) then
    cat_order := array[cur_status] || array_remove(cat_order, cur_status);
  end if;

  with m as (
    select * from public.submissions_search_scored(q, incl_desc, incl_tasks)
  ),
  counts as (
    select coalesce(jsonb_object_agg(t.status, t.n), '{}'::jsonb) as j
    from (select m.status::text as status, count(*) as n from m group by m.status) t
  ),
  kept as (
    select m.id, m.score from m where m.status::text = any (statuses)
  ),
  page as (
    select s.id, s.legacy_id, s.source,
           s.first_name, s.last_name, s.phone, s.alt_phone, s.call_schedule, s.email,
           s.street, s.zipcode, s.city, s.state_country, s.time_zone, s.distance_miles,
           s.year, s.make, s.model, s.budget, s.project_start, s.project_description,
           s.restoration_decision_matrix, s.storage_type, s.storage_years,
           s.status, s.status_changed_at, s.received_date, s.original_date,
           s.bumped_at, s.added_by, s.notes,
           s.call_attempt_one, s.call_attempt_two, s.call_attempt_three, s.email_attempt,
           s.image_name_1, s.image_name_2, s.image_name_3, s.image_name_4,
           kept.score,
           row_number() over (
             order by array_position(cat_order, s.status::text),
                      case when sort_key = 'relevance' then kept.score end desc,
                      case when sort_key = 'name'    and sort_dir = 'asc'  then s.last_name end asc,
                      case when sort_key = 'name'    and sort_dir = 'desc' then s.last_name end desc,
                      case when sort_key = 'vehicle' and sort_dir = 'asc'  then s.year end asc,
                      case when sort_key = 'vehicle' and sort_dir = 'desc' then s.year end desc,
                      case when sort_key = 'distance' and sort_dir = 'asc'  then s.distance_miles end asc,
                      case when sort_key = 'distance' and sort_dir = 'desc' then s.distance_miles end desc,
                      case when sort_key = 'received' and sort_dir = 'asc'  then s.bumped_at end asc nulls last,
                      case when sort_key = 'received' and sort_dir = 'desc' then s.bumped_at end desc nulls last,
                      case when sort_key = 'received' and sort_dir = 'asc'  then s.received_date end asc nulls last,
                      case when sort_key = 'received' and sort_dir = 'desc' then s.received_date end desc nulls last,
                      kept.score desc,
                      s.received_date desc nulls last,
                      s.id
           ) as rk
    from kept
    join submissions s on s.id = kept.id
  )
  select jsonb_build_object(
    'total',  (select count(*) from kept),
    'counts', (select j from counts),
    'rows',   coalesce((
      select jsonb_agg(to_jsonb(p) - 'rk' order by p.rk)
      from (select * from page where rk > off and rk <= off + lim) p
    ), '[]'::jsonb)
  )
  into result;

  return result;
end;
$$;

grant execute on function public.submissions_search(text, text, text[], text, text, int, int, boolean, boolean) to authenticated;
