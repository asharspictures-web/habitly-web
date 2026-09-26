-- Run AFTER creating the 'food-photos' bucket in the Supabase Dashboard
-- (Storage -> New bucket -> name "food-photos" -> Private).
-- Path convention enforced by these policies: {user_id}/{filename}

drop policy if exists "food_photos_select_own" on storage.objects;
create policy "food_photos_select_own" on storage.objects
  for select using (bucket_id = 'food-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "food_photos_insert_own" on storage.objects;
create policy "food_photos_insert_own" on storage.objects
  for insert with check (bucket_id = 'food-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "food_photos_update_own" on storage.objects;
create policy "food_photos_update_own" on storage.objects
  for update using (bucket_id = 'food-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "food_photos_delete_own" on storage.objects;
create policy "food_photos_delete_own" on storage.objects
  for delete using (bucket_id = 'food-photos' and (storage.foldername(name))[1] = auth.uid()::text);
