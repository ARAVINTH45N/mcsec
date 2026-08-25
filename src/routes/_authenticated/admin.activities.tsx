import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Trash2, Users } from "lucide-react";
import { useSession } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/admin/activities")({
  component: ActivitiesAdmin,
});

function ActivitiesAdmin() {
  const qc = useQueryClient();
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "Learning", deadline: "", resource_links: "" });
  const [assignAll, setAssignAll] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const { data: activities = [] } = useQuery({
    queryKey: ["admin_activities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("activities").select("*, activity_assignments(id, status)").order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Array<{ id: string; title: string; category: string; description: string; deadline: string | null; activity_assignments: { id: string; status: string }[] }>;
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["all_profiles_list"],
    queryFn: async () => (await supabase.from("member_directory").select("id, full_name, member_id")).data ?? [],
  });

  const create = async () => {
    if (!form.title || !user) return toast.error("Title required");
    const links = form.resource_links.split("\n").map((s) => s.trim()).filter(Boolean);
    const { data: act, error } = await supabase.from("activities").insert({
      title: form.title,
      description: form.description,
      category: form.category,
      deadline: form.deadline || null,
      resource_links: links,
      created_by: user.id,
    }).select().single();
    if (error) return toast.error(error.message);

    const targetIds = assignAll ? profiles.map((p) => p.id) : selectedUsers;
    if (targetIds.length > 0) {
      const rows = targetIds.map((uid) => ({ activity_id: act.id, user_id: uid, status: "not_started" }));
      await supabase.from("activity_assignments").insert(rows);
      const notifRows = targetIds.map((uid) => ({
        user_id: uid,
        title: `New activity assigned: ${act.title}`,
        body: act.description?.slice(0, 200),
        link: "/dashboard",
        activity_id: act.id,
      }));
      await supabase.from("notifications").insert(notifRows);
    }
    toast.success("Activity created and assigned");
    setOpen(false);
    setForm({ title: "", description: "", category: "Learning", deadline: "", resource_links: "" });
    setSelectedUsers([]);
    qc.invalidateQueries({ queryKey: ["admin_activities"] });
  };

  const del = async (id: string) => {
    if (!confirm("Delete this activity?")) return;
    const { error } = await supabase.from("activities").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin_activities"] }); }
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New activity</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create activity</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Category</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {["Learning", "Workshop", "Hackathon", "Assignment"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><Label>Deadline</Label><Input type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
              </div>
              <div><Label>Resource links (one per line)</Label><Textarea rows={2} value={form.resource_links} onChange={(e) => setForm({ ...form, resource_links: e.target.value })} /></div>
              <div>
                <Label>Assign to</Label>
                <div className="mt-2 flex items-center gap-2">
                  <Checkbox checked={assignAll} onCheckedChange={(v) => setAssignAll(!!v)} id="all" />
                  <label htmlFor="all" className="text-sm">All members ({profiles.length})</label>
                </div>
                {!assignAll && (
                  <div className="mt-3 max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                    {profiles.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={selectedUsers.includes(p.id)} onCheckedChange={(v) => setSelectedUsers(v ? [...selectedUsers, p.id] : selectedUsers.filter((x) => x !== p.id))} />
                        {p.full_name} <span className="text-xs text-muted-foreground">{p.member_id}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <Button onClick={create} className="w-full">Create & assign</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {activities.map((a) => {
          const total = a.activity_assignments?.length ?? 0;
          const done = a.activity_assignments?.filter((x) => x.status === "completed").length ?? 0;
          const pct = total ? Math.round((done / total) * 100) : 0;
          return (
            <div key={a.id} className="fluent-card p-5">
              <div className="flex justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs">{a.category}</span>
                    <h3 className="font-semibold">{a.title}</h3>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.description}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {done}/{total} completed</span>
                    <span>{pct}% completion</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => del(a.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          );
        })}
        {activities.length === 0 && <div className="fluent-card p-12 text-center text-muted-foreground">No activities yet</div>}
      </div>
    </div>
  );
}
