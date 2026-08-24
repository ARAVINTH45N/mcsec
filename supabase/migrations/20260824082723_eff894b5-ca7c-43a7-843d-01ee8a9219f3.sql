DROP POLICY IF EXISTS "profiles readable by authenticated" ON public.profiles;

CREATE POLICY "users read own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE VIEW public.member_directory AS
SELECT id, full_name, member_id, department, year_of_study, avatar_url, is_active, created_at
FROM public.profiles;

GRANT SELECT ON public.member_directory TO authenticated;