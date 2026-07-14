import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin/applications")({
  component: AppsAdmin,
});

function AppsAdmin() {
  const qc = useQueryClient();
  const { data: apps = [] } = useQuery({
    queryKey: ["admin_apps"],
    queryFn: async () => (await supabase.from("membership_applications").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const update = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("membership_applications").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Application ${status}`); qc.invalidateQueries({ queryKey: ["admin_apps"] }); }
  };

  return (
    <div className="grid gap-3">
      {apps.map((a) => (
        <div key={a.id} className="fluent-card p-5">
          <div className="flex flex-col justify-between gap-3 md:flex-row">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{a.name}</h3>
                <StatusPill status={a.status} />
                <span className="text-xs text-muted-foreground">· {format(new Date(a.created_at), "MMM d, yyyy")}</span>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{a.register_no} · {a.department} · Year {a.year_of_study}</div>
              <div className="mt-1 text-sm">{a.email} · {a.phone}</div>
              <p className="mt-2 text-sm">{a.reason}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {(a.interests ?? []).map((i: string) => <span key={i} className="rounded-full bg-accent px-2 py-0.5 text-xs">{i}</span>)}
              </div>
            </div>
            {a.status === "pending" && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => update(a.id, "approved")}><Check className="mr-1 h-4 w-4" /> Approve</Button>
                <Button size="sm" variant="outline" onClick={() => update(a.id, "rejected")}><X className="mr-1 h-4 w-4" /> Reject</Button>
              </div>
            )}
          </div>
        </div>
      ))}
      {apps.length === 0 && <div className="fluent-card p-12 text-center text-muted-foreground">No applications</div>}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-ms-yellow/20 text-ms-yellow",
    approved: "bg-ms-green/10 text-ms-green",
    rejected: "bg-destructive/10 text-destructive",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-muted"}`}>{status}</span>;
}
