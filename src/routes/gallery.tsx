import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Image as ImageIcon, X } from "lucide-react";
import { format } from "date-fns";
import { StorageImage } from "@/components/StorageImage";
import { useStorageUrl } from "@/lib/storage";

export const Route = createFileRoute("/gallery")({
  component: GalleryPage,
  head: () => ({ meta: [
    { title: "Gallery — Microsoft Club SEC" },
    { name: "description", content: "Photos and moments from Microsoft Club SEC events, workshops and hackathons." },
  ] }),
});

interface Post {
  id: string;
  title: string;
  caption: string | null;
  event_date: string | null;
  gallery_images: { id: string; image_url: string; sort_order: number }[];
}

function GalleryPage() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["gallery_public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_posts")
        .select("id, title, caption, event_date, gallery_images(id, image_url, sort_order)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Post[];
    },
  });
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
      <div className="mb-10">
        <h1 className="text-3xl font-bold md:text-4xl">Gallery</h1>
        <p className="mt-2 text-muted-foreground">Moments from our workshops, hackathons and events.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="fluent-card h-64 animate-pulse" />)}
        </div>
      ) : !posts?.length ? (
        <div className="fluent-card flex flex-col items-center gap-3 p-16 text-center">
          <ImageIcon className="h-10 w-10 text-muted-foreground" />
          <h3 className="font-semibold">No photos yet</h3>
          <p className="text-sm text-muted-foreground">Event photos and clips will appear here.</p>
        </div>
      ) : (
        <div className="columns-1 gap-4 md:columns-2 lg:columns-3">
          {posts.map((p) => (
            <div key={p.id} className="fluent-card fluent-card-hover mb-4 break-inside-avoid overflow-hidden">
              {p.gallery_images[0] && (
                <button onClick={() => setLightbox(p.gallery_images[0].image_url)} className="block w-full">
                  <StorageImage bucket="gallery" value={p.gallery_images[0].image_url} alt={p.title} className="w-full object-cover" />
                </button>
              )}
              <div className="p-4">
                <h3 className="font-semibold">{p.title}</h3>
                {p.caption && <p className="mt-1 text-sm text-muted-foreground">{p.caption}</p>}
                {p.event_date && <p className="mt-2 text-xs text-muted-foreground">{format(new Date(p.event_date), "MMM d, yyyy")}</p>}
                {p.gallery_images.length > 1 && (
                  <div className="mt-3 grid grid-cols-4 gap-1">
                    {p.gallery_images.slice(1, 5).map((img) => (
                      <button key={img.id} onClick={() => setLightbox(img.image_url)}>
                        <img src={img.image_url} alt="" className="aspect-square w-full rounded object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white" onClick={() => setLightbox(null)}><X /></button>
          <img src={lightbox} alt="" className="max-h-[90vh] max-w-full rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
