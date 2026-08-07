create extension if not exists pg_trgm;

create index if not exists submissions_year_trgm
  on submissions using gin (year gin_trgm_ops);
create index if not exists submissions_state_country_trgm
  on submissions using gin (state_country gin_trgm_ops);
create index if not exists submissions_project_description_trgm
  on submissions using gin (project_description gin_trgm_ops);
create index if not exists detail_stages_description_trgm
  on submission_detail_stages using gin (description gin_trgm_ops);
create index if not exists detail_stages_label_trgm
  on submission_detail_stages using gin (stage_label gin_trgm_ops);

create or replace function public.submissions_search_scored(q text)
returns table (id bigint, status submission_status, score real)
language plpgsql
stable
security invoker
set search_path = public, extensions
as $$
declare
  toks    text[];
  tok     text;
  pat     text;
  i       int;
  cap     int;
  ids     bigint[] := '{}';
  all_ids bigint[];
  bounds  int[]    := array[0];
  keep    int[]    := '{}';
begin
  perform set_config('pg_trgm.word_similarity_threshold', '0.45', true);

  select array_agg(x) into toks
  from unnest(regexp_split_to_array(lower(btrim(coalesce(q, ''))), '\s+')) as x
  where length(x) >= 2;

  if toks is null then
    return;
  end if;

  for i in 1 .. array_length(toks, 1) loop
    tok := toks[i];
    pat := '%' || replace(replace(replace(tok, '\', '\\'), '%', '\%'), '_', '\_') || '%';

    ids := ids || array(
      select s.id from submissions s where s.make %> tok
      union select s.id from submissions s where s.model %> tok
      union select s.id from submissions s where s.year %> tok
      union select s.id from submissions s where s.first_name %> tok
      union select s.id from submissions s where s.last_name %> tok
      union select s.id from submissions s where s.city %> tok
      union select s.id from submissions s where s.state_country %> tok
      union select s.id from submissions s where s.email %> tok
      union select s.id from submissions s where s.project_description ilike pat
      union select d.submission_id from submission_detail_stages d where d.description ilike pat
      union select d.submission_id from submission_detail_stages d where d.stage_label ilike pat
    );
    bounds := bounds || coalesce(array_length(ids, 1), 0);
  end loop;

  cap := greatest(250, (reltuples / 4)::int)
         from pg_class where oid = 'submissions'::regclass;

  for i in 1 .. array_length(toks, 1) loop
    if bounds[i + 1] - bounds[i] <= cap then
      keep := keep || i;
    end if;
  end loop;

  if array_length(keep, 1) is not null and array_length(keep, 1) < array_length(toks, 1) then
    all_ids := ids;
    ids     := '{}';
    foreach i in array keep loop
      ids := ids || all_ids[bounds[i] + 1 : bounds[i + 1]];
    end loop;
  end if;

  if array_length(ids, 1) is null then
    return;
  end if;

  return query
  with k as (
    select unnest(toks) as tok
  ),
  b as (
    select s.id,
           s.status,
           lower(concat_ws(' ', s.year, s.make, s.model))   as b_vehicle,
           lower(concat_ws(' ', s.first_name, s.last_name)) as b_name,
           lower(concat_ws(' ', s.city, s.state_country))   as b_city,
           lower(coalesce(s.email, ''))                     as b_email,
           lower(coalesce(s.project_description, ''))       as b_desc,
           coalesce(st.txt, '')                             as b_tasks
    from submissions s
    left join lateral (
      select lower(string_agg(concat_ws(' ', d.stage_label, d.description), ' ')) as txt
      from submission_detail_stages d
      where d.submission_id = s.id
    ) st on true
    where s.id = any (ids)
      and s.status <> 'deleted'
  ),
  f as (
    select b.id,
           b.status,
           avg(case when b.b_vehicle = '' then 0 else word_similarity(k.tok, b.b_vehicle) end)::real as f_vehicle,
           avg(case when b.b_name    = '' then 0 else word_similarity(k.tok, b.b_name)    end)::real as f_name,
           avg(case when b.b_city    = '' then 0 else word_similarity(k.tok, b.b_city)    end)::real as f_city,
           avg(case when b.b_email   = '' then 0 else word_similarity(k.tok, b.b_email)   end)::real as f_email,
           avg(case when position(k.tok in b.b_desc)  > 0 then 1 else 0 end)::real as f_desc,
           avg(case when position(k.tok in b.b_tasks) > 0 then 1 else 0 end)::real as f_tasks
    from b
    cross join k
    group by b.id, b.status
  ),
  w as (
    select f.id,
           f.status,
           greatest(1.00 * f.f_vehicle, 0.92 * f.f_name, 0.84 * f.f_city,
                    0.76 * f.f_email,   0.45 * f.f_desc, 0.40 * f.f_tasks) as best,
           ((f.f_vehicle >= 0.6)::int + (f.f_name  >= 0.6)::int + (f.f_city  >= 0.6)::int
          + (f.f_email   >= 0.6)::int + (f.f_desc  >= 0.6)::int + (f.f_tasks >= 0.6)::int) as hits
    from f
  )
  select w.id, w.status, least(1.0, w.best + 0.02 * w.hits)::real
  from w
  where w.best >= 0.18;
end;
$$;

grant execute on function public.submissions_search_scored(text) to authenticated;

create or replace function public.submissions_search(
  q          text,
  cur_status text    default 'new',
  statuses   text[]  default array['new','pending','active','finished','possible','archived'],
  sort_key   text    default 'relevance',
  lim        int     default 25,
  off        int     default 0
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
    select * from public.submissions_search_scored(q)
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
                      case when sort_key = 'name'      then s.last_name end asc,
                      case when sort_key = 'vehicle'   then s.year end asc,
                      case when sort_key = 'distance'  then s.distance_miles end desc,
                      case when sort_key = 'received'  then s.bumped_at end desc nulls last,
                      case when sort_key = 'received'  then s.received_date end desc nulls last,
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

grant execute on function public.submissions_search(text, text, text[], text, int, int) to authenticated;
