import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  id: number;
  whatsapp_url: string | null;
  linkedin_url: string | null;
  contact_email: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_bg_url: string | null;
  global_bg_url: string | null;
}

export function useSiteSettings() {
  return useQuery<SiteSettings | null>({
    queryKey: ["site_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data as SiteSettings | null;
    },
    staleTime: 60_000,
  });
}
