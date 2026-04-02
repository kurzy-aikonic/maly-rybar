-- Fotky u zaznamu deniku (private bucket + cesta v radku)
alter table public.diary_entries
add column if not exists photo_storage_path text null;

comment on column public.diary_entries.photo_storage_path is 'Relativni cesta v bucketu catch-photos, napr. user_uuid/client_id.jpg';

insert into storage.buckets (id, name, public)
values ('catch-photos', 'catch-photos', false)
on conflict (id) do nothing;

-- RLS: kazdy uct vidí jen objekty ve svem prefixu (prvni segment = auth.uid)
drop policy if exists "catch_photos_select_own" on storage.objects;
create policy "catch_photos_select_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'catch-photos'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "catch_photos_insert_own" on storage.objects;
create policy "catch_photos_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'catch-photos'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "catch_photos_update_own" on storage.objects;
create policy "catch_photos_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'catch-photos'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'catch-photos'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "catch_photos_delete_own" on storage.objects;
create policy "catch_photos_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'catch-photos'
  and split_part(name, '/', 1) = auth.uid()::text
);
