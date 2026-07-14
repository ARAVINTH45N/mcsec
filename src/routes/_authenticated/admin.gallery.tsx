import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { useSession } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/admin/gallery")({
  component: GalleryAdmin,
});

function GalleryAdmin() {
  const qc = useQueryClient();
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", caption: "", event_date: "" });
  const [files, setFiles] = useState<FileList | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: posts = [] } = useQuery({
    queryKey: ["admin_gallery"],
    queryFn: async () => (await supabase.from("gallery_posts").select("*, gallery_images(id, image_url)").order("created_at", { ascending: false })).data as unknown as Array<{ id: string; title: string; caption: string; gallery_images: { id: string; image_url: string }[] }>,
  });

  const create = async () => {
    if (!form.title || !user || !files?.length) return toast.error("Title and images required");
    setSaving(true);
    const { data: post, error } = await supabase.from("gallery_posts").insert({
      title: form.title, caption: form.caption, event_date: form.event_date || null, created_by: user.id,
    }).select().single();
    if (error) { setSaving(false); return toast.error(error.message); }

    const uploads = await Promise.all(Array.from(files).map(async (f, i) => {
      const path = `${post.id}/${Date.now()}-${i}-${f.name}`;
      const { error: e1 } = await supabase.storage.from("gallery").upload(path, f);
      if (e1) return null;
      const { data: pub } = supabase.storage.from("gallery").getPublicUrl(path);
      return { post_id: post.id, image_url: pub.publicUrl, sort_order: i };
    }));
    const valid = uploads.filter(Boolean) as { post_id: string; image_url: string; sort_order: number }[];
    if (valid.length) await supabase.from("gallery_images").insert(valid);
    setSaving(false);
    setOpen(false);
    setForm({ title: "", caption: "", event_date: "" });
    setFiles(null);
    toast.success("Post created");
    qc.invalidateQueries({ queryKey: ["admin_gallery"] });
    qc.invalidateQueries({ queryKey: ["gallery_public"] });
  };

  const del = async (id: string) => {
    if (!confirm("Delete this gallery post?")) return;
    const { error } = await supabase.from("gallery_posts").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin_gallery"] }); qc.invalidateQueries({ queryKey: ["gallery_public"] }); }
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New gallery post</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New gallery post</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Caption</Label><Textarea rows={2} value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} /></div>
              <div><Label>Event date</Label><Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></div>
              <div><Label>Images (multiple)</Label><Input type="file" accept="image/*" multiple onChange={(e) => setFiles(e.target.files)} /></div>
              <Button onClick={create} disabled={saving} className="w-full">{saving ? "Uploading…" : "Create post"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {posts?.map((p) => (
          <div key={p.id} className="fluent-card overflow-hidden">
            {p.gallery_images[0] && <img src={p.gallery_images[0].image_url} alt="" className="h-48 w-full object-cover" />}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="text-xs text-muted-foreground">{p.gallery_images.length} image(s)</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => del(p.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        ))}
        {(!posts || posts.length === 0) && <div className="fluent-card col-span-full p-12 text-center text-muted-foreground">No posts yet</div>}
      </div>
    </div>
  );
}
