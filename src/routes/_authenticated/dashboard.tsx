import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useSession, useProfile } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, Clock, PlayCircle, ArrowRight, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format, isPast } from "date-fns";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
  head: () => ({ meta: [{ title: "Dashboard — Microsoft Club SEC" }] }),
});

interface Assignment {
  id: string;
  status: string;
  admin_verified: boolean;
  completed_at: string | null;
  activities: { id: string; title: string; description: string; category: string; deadline: string | null } | null;
}

function DashboardPage() {
  const { user } = useSession();
  const { data: profile } = useProfile(user);
  const qc = useQueryClient();

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["my_assignments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_assignments")
        .select("id, status, admin_verified, completed_at, activities(id, title, description, category, deadline)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Assignment[];
    },
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`assignments:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_assignments", filter: `user_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["my_assignments", user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("activity_assignments")
        .update({ status, completed_at: status === "completed" ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my_assignments", user?.id] });
      toast.success("Status updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const total = assignments.length;
  const completed = assignments.filter((a) => a.status === "completed").length;
  const inProgress = assignments.filter((a) => a.status === "in_progress").length;
  const overdue = assignments.filter((a) => a.status !== "completed" && a.activities?.deadline && isPast(new Date(a.activities.deadline))).length;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      {/* Header */}
      <div className="fluent-card mb-8 flex flex-col gap-6 p-6 md:flex-row md:items-center md:p-8">
        <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-2xl font-bold text-primary-foreground">
          {profile?.full_name?.[0]?.toUpperCase() ?? "M"}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{profile?.full_name ?? "Member"}</h1>
          <p className="text-sm text-muted-foreground">{profile?.department} · Year {profile?.year_of_study}</p>
          <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            <Award className="h-3 w-3" /> {profile?.member_id}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ProgressRing value={pct} />
          <div className="text-sm">
            <div className="text-2xl font-bold">{pct}%</div>
            <div className="text-xs text-muted-foreground">Overall progress</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total assigned", value: total, color: "text-primary" },
          { label: "Completed", value: completed, color: "text-ms-green" },
          { label: "In progress", value: inProgress, color: "text-ms-blue" },
          { label: "Overdue", value: overdue, color: "text-destructive" },
        ].map((s) => (
          <div key={s.label} className="fluent-card p-5">
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Assignments */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your activities</h2>
        <Link to="/profile"><Button variant="ghost" size="sm">View profile <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
      </div>

      {isLoading ? (
        <div className="grid gap-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="fluent-card h-24 animate-pulse" />)}</div>
      ) : assignments.length === 0 ? (
        <div className="fluent-card p-12 text-center text-muted-foreground">No activities assigned yet. Watch this space!</div>
      ) : (
        <div className="grid gap-3">
          {assignments.map((a) => {
            const isOverdue = a.status !== "completed" && a.activities?.deadline && isPast(new Date(a.activities.deadline));
            return (
              <div key={a.id} className="fluent-card p-5">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={isOverdue ? "overdue" : a.status} />
                      <span className="rounded-full bg-accent px-2 py-0.5 text-xs">{a.activities?.category}</span>
                      {a.admin_verified && <span className="inline-flex items-center gap-1 rounded-full bg-ms-green/10 px-2 py-0.5 text-xs text-ms-green"><CheckCircle2 className="h-3 w-3" /> Verified</span>}
                    </div>
                    <h3 className="mt-2 font-semibold">{a.activities?.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.activities?.description}</p>
                    {a.activities?.deadline && (
                      <div className="mt-2 text-xs text-muted-foreground">Due {format(new Date(a.activities.deadline), "MMM d, yyyy")}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {a.status !== "in_progress" && a.status !== "completed" && (
                      <Button size="sm" variant="secondary" onClick={() => updateStatus.mutate({ id: a.id, status: "in_progress" })}>Start</Button>
                    )}
                    {a.status !== "completed" && (
                      <Button size="sm" onClick={() => updateStatus.mutate({ id: a.id, status: "completed" })}>Complete</Button>
                    )}
                    {a.status === "completed" && !a.admin_verified && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: a.id, status: "in_progress" })}>Reopen</Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  const r = 28, c = 2 * Math.PI * r, off = c - (value / 100) * c;
  return (
    <svg width="72" height="72" className="-rotate-90">
      <circle cx="36" cy="36" r={r} fill="none" stroke="var(--color-muted)" strokeWidth="6" />
      <circle cx="36" cy="36" r={r} fill="none" stroke="var(--color-primary)" strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} className="transition-all duration-500" />
    </svg>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
    not_started: { label: "Not started", className: "bg-muted text-muted-foreground", icon: Clock },
    in_progress: { label: "In progress", className: "bg-ms-blue/10 text-ms-blue", icon: PlayCircle },
    completed: { label: "Completed", className: "bg-ms-green/10 text-ms-green", icon: CheckCircle2 },
    overdue: { label: "Overdue", className: "bg-destructive/10 text-destructive", icon: Clock },
  };
  const s = map[status] ?? map.not_started;
  const I = s.icon;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.className}`}><I className="h-3 w-3" /> {s.label}</span>;
}
