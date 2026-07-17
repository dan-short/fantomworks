-- Storage bucket for the public self-submission form's vehicle photos.
--
-- The form (web/app/submit) uploads up to 4 JPG/PNG images per submission via the
-- browser Supabase client (web/lib/photo-upload.ts) into the `submission-photos`
-- bucket. In dev / seed mode (no Supabase env) the form falls back to in-session
-- object-URL previews and this bucket is unused.
--
-- Run once on the real project. Public read so previews/recaps can render; anon
-- insert so an unauthenticated customer can attach photos. Tighten later (size /
-- mime limits are set on the bucket; consider a signed-upload flow in Phase 2).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'submission-photos',
  'submission-photos',
  true,
  10485760, -- 10 MB per file
  array['image/jpeg', 'image/png']
)
on conflict (id) do nothing;

-- Anonymous customers may upload into the bucket (public form, no login).
create policy "submission-photos anon insert"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'submission-photos');

-- Public read (bucket is public, but make the intent explicit for object listing).
create policy "submission-photos public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'submission-photos');
