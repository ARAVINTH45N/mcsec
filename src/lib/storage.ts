import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Bucket = "avatars" | "gallery" | "site-assets";

const ONE_WEEK = 60 * 60 * 24 * 7;

/**
 * Storage buckets are private, so stored values are object paths.
 * Legacy rows may hold absolute URLs — those are returned as-is.
 */
export async function resolveStorageUrl(bucket: Bucket, value?: string | null): Promise<string | null> {
  if (!value) return null;

  let path = value;
  // Legacy rows may hold absolute public URLs from when buckets were public.
  const publicMatch = value.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+?)(?:\?|$)/);
  if (publicMatch) {
    path = decodeURIComponent(publicMatch[2]);
  } else if (/^(https?:|data:|\/)/.test(value)) {
    return value;
  }

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, ONE_WEEK);
  if (error) return null;
  return data?.signedUrl ?? null;
}


export function useStorageUrl(bucket: Bucket, value?: string | null) {
  return useQuery({
    queryKey: ["storage_url", bucket, value],
    enabled: !!value,
    staleTime: ONE_WEEK * 500,
    queryFn: () => resolveStorageUrl(bucket, value),
  });
}

export function useStorageUrls(bucket: Bucket, values: (string | null | undefined)[]) {
  const keys = values.filter(Boolean) as string[];
  return useQuery({
    queryKey: ["storage_urls", bucket, [...keys].sort().join("|")],
    enabled: keys.length > 0,
    staleTime: ONE_WEEK * 500,
    queryFn: async () => {
      const entries = await Promise.all(
        keys.map(async (k) => [k, await resolveStorageUrl(bucket, k)] as const),
      );
      return Object.fromEntries(entries) as Record<string, string | null>;
    },
  });
}
