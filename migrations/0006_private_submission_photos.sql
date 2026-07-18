update storage.buckets set public = false where id = 'submission-photos';

drop policy if exists "submission-photos public read" on storage.objects;

create policy "submission-photos staff read"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'submission-photos');
