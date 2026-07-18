insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'submission-photos',
  'submission-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png']
)
on conflict (id) do nothing;

create policy "submission-photos anon insert"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'submission-photos');

create policy "submission-photos public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'submission-photos');
