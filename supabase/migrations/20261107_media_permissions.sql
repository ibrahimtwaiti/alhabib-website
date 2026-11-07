-- V2: optional permission refinement for sub-admin uploads.
-- Run once in Supabase SQL Editor if junior content managers need image upload.
-- The existing super_admin upload policy remains valid and unchanged.
-- Images are limited to the public site-media bucket; never store patient files here.
drop policy if exists "v2 module image uploads" on storage.objects;
create policy "v2 module image uploads" on storage.objects for insert
with check (
  bucket_id = 'site-media'
  and (
    public.has_permission('specialists')
    or public.has_permission('specialties')
    or public.has_permission('blog')
    or public.has_permission('achievements')
    or public.has_permission('settings')
    or public.has_permission('sections')
  )
);
