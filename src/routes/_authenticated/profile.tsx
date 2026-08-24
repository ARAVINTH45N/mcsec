import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useSession, useProfile } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Award, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { StorageImage } from "@/components/StorageImage";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile — Microsoft Club SEC" }] }),
});

function ProfilePage() {
  const { user } = useSession();
  const { data: profile } = useProfile(user);
  const qc = useQueryClient();
  const [form, setForm] = useState({ full_name: "", phone: "", department: "", year_of_study: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) setForm({
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      department: profile.department ?? "",
      year_of_study: profile.year_of_study ?? "",
    });
  }, [profile]);

  if (!user || !profile) return <div className="p-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${user.id}/avatar-${Date.now()}.${file.name.split(".").pop()}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { setUploading(false); return toast.error(upErr.message); }
    const { error } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", user.id);
    setUploading(false);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["profile", user.id] });
    toast.success("Avatar updated");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <div className="fluent-card p-6 md:p-8">
        <div className="flex items-center gap-6">
          <div className="relative">
            <StorageImage
              bucket="avatars"
              value={profile.avatar_url}
              alt=""
              className="h-24 w-24 rounded-2xl object-cover"
              fallback={
                <div className="grid h-24 w-24 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-3xl font-bold text-primary-foreground">
                  {profile.full_name?.[0]?.toUpperCase() ?? "M"}
                </div>
              }
            />
            <label className="absolute -bottom-2 right-0 cursor-pointer rounded-full bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground shadow-fluent">
              {uploading ? "…" : "Edit"}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
            </label>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile.full_name || "Member"}</h1>
            <p className="text-sm text-muted-foreground">{profile.college_email}</p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Award className="h-3 w-3" /> {profile.member_id}
            </div>
          </div>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            const { error } = await supabase.from("profiles").update(form).eq("id", user.id);
            setSaving(false);
            if (error) return toast.error(error.message);
            qc.invalidateQueries({ queryKey: ["profile", user.id] });
            toast.success("Profile updated");
          }}
          className="mt-8 grid gap-4 md:grid-cols-2"
        >
          <div><Label>Full name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div><Label>Member ID (immutable)</Label><Input value={profile.member_id} disabled /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label>Department</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
          <div>
            <Label>Year of study</Label>
            <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.year_of_study} onChange={(e) => setForm({ ...form, year_of_study: e.target.value })}>
              {["1","2","3","4"].map((y) => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div><Label>College email (immutable)</Label><Input value={profile.college_email} disabled /></div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
