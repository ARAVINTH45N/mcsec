import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsAdmin,
});

function SettingsAdmin() {
  const { data: settings } = useSiteSettings();
  const qc = useQueryClient();
  const [form, setForm] = useState({ whatsapp_url: "", linkedin_url: "", contact_email: "", hero_title: "", hero_subtitle: "", hero_bg_url: "", global_bg_url: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) setForm({
      whatsapp_url: settings.whatsapp_url ?? "",
      linkedin_url: settings.linkedin_url ?? "",
      contact_email: settings.contact_email ?? "",
      hero_title: settings.hero_title ?? "",
      hero_subtitle: settings.hero_subtitle ?? "",
      hero_bg_url: settings.hero_bg_url ?? "",
      global_bg_url: settings.global_bg_url ?? "",
    });
  }, [settings]);

  const uploadBg = async (kind: "hero_bg_url" | "global_bg_url", file: File) => {
    const path = `bg/${kind}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);
    setForm({ ...form, [kind]: path });
    toast.success("Uploaded — save to apply");
  };

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        const { error } = await supabase.from("site_settings").update(form).eq("id", 1);
        setSaving(false);
        if (error) return toast.error(error.message);
        toast.success("Settings saved");
        qc.invalidateQueries({ queryKey: ["site_settings"] });
      }}
      className="fluent-card space-y-4 p-6"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div><Label>WhatsApp group URL</Label><Input value={form.whatsapp_url} onChange={(e) => setForm({ ...form, whatsapp_url: e.target.value })} /></div>
        <div><Label>LinkedIn page URL</Label><Input value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} /></div>
        <div><Label>Contact email</Label><Input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
      </div>
      <div><Label>Hero title</Label><Input value={form.hero_title} onChange={(e) => setForm({ ...form, hero_title: e.target.value })} /></div>
      <div><Label>Hero subtitle</Label><Textarea rows={2} value={form.hero_subtitle} onChange={(e) => setForm({ ...form, hero_subtitle: e.target.value })} /></div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Hero background image</Label>
          <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadBg("hero_bg_url", e.target.files[0])} />
          {form.hero_bg_url && <img src={form.hero_bg_url} alt="" className="mt-2 h-24 rounded-md object-cover" />}
        </div>
        <div>
          <Label>Global background image</Label>
          <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadBg("global_bg_url", e.target.files[0])} />
          {form.global_bg_url && <img src={form.global_bg_url} alt="" className="mt-2 h-24 rounded-md object-cover" />}
        </div>
      </div>
      <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save settings"}</Button>
    </form>
  );
}
