import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export function useProfile(user: User | null) {
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useIsAdmin(user: User | null) {
  return useQuery({
    queryKey: ["is_admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (error) throw error;
      return (data ?? []).some((r) => r.role === "admin");
    },
  });
}
