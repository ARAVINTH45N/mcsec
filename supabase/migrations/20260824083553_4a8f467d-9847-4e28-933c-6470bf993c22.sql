GRANT SELECT ON public.member_directory TO anon;
CREATE POLICY "directory public count" ON public.member_directory FOR SELECT TO anon USING (true);