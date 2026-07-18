create policy "staff select submissions" on submissions
  for select to authenticated using (true);
create policy "staff insert submissions" on submissions
  for insert to authenticated with check (true);
create policy "staff update submissions" on submissions
  for update to authenticated using (true) with check (true);
create policy "staff delete submissions" on submissions
  for delete to authenticated using (true);

create policy "staff select stages" on submission_detail_stages
  for select to authenticated using (true);
create policy "staff insert stages" on submission_detail_stages
  for insert to authenticated with check (true);
create policy "staff update stages" on submission_detail_stages
  for update to authenticated using (true) with check (true);
create policy "staff delete stages" on submission_detail_stages
  for delete to authenticated using (true);

alter table zipcodes enable row level security;
create policy "staff select zipcodes" on zipcodes
  for select to authenticated using (true);
