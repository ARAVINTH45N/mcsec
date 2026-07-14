
-- Public read for gallery, avatars, site-assets
CREATE POLICY "public read gallery" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "public read site-assets" ON storage.objects FOR SELECT USING (bucket_id = 'site-assets');

-- Users upload/update their own avatar folder (folder name = user_id)
CREATE POLICY "user upload own avatar" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "user update own avatar" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "user delete own avatar" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Admins manage gallery and site-assets
CREATE POLICY "admin manage gallery" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manage site-assets" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));
