DROP VIEW IF EXISTS public.member_directory;

CREATE TABLE public.member_directory (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  member_id text NOT NULL DEFAULT '',
  department text DEFAULT '',
  year_of_study text DEFAULT '',
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.member_directory TO authenticated;
GRANT ALL ON public.member_directory TO service_role;

ALTER TABLE public.member_directory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "directory readable by authenticated"
ON public.member_directory FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.sync_member_directory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.member_directory (id, full_name, member_id, department, year_of_study, avatar_url, is_active, created_at, updated_at)
  VALUES (NEW.id, NEW.full_name, NEW.member_id, NEW.department, NEW.year_of_study, NEW.avatar_url, NEW.is_active, NEW.created_at, now())
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    member_id = EXCLUDED.member_id,
    department = EXCLUDED.department,
    year_of_study = EXCLUDED.year_of_study,
    avatar_url = EXCLUDED.avatar_url,
    is_active = EXCLUDED.is_active,
    updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_member_directory() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER profiles_sync_directory
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_member_directory();

INSERT INTO public.member_directory (id, full_name, member_id, department, year_of_study, avatar_url, is_active, created_at, updated_at)
SELECT id, full_name, member_id, department, year_of_study, avatar_url, is_active, created_at, now() FROM public.profiles
ON CONFLICT (id) DO NOTHING;