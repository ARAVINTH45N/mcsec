import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, ListChecks, UserPlus, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const { data: stats } = useQuery({
    queryKey: ["admin_stats"],
    queryFn: async () => {
      const [members, activities, pending, assignments] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("activities").select("id", { count: "exact", head: true }),
        supabase.from("membership_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("activity_assignments").select("status"),
      ]);
      const total = assignments.data?.length ?? 0;
      const done = assignments.data?.filter((a) => a.status === "completed").length ?? 0;
      return {
        members: members.count ?? 0,
        activities: activities.count ?? 0,
        pending: pending.count ?? 0,
        engagement: total ? Math.round((done / total) * 100) : 0,
      };
    },
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, member_id");
      const { data: assigns } = await supabase.from("activity_assignments").select("user_id, status");
      const map = new Map<string, { total: number; done: number }>();
      (assigns ?? []).forEach((a) => {
        const s = map.get(a.user_id) ?? { total: 0, done: 0 };
        s.total += 1;
        if (a.status === "completed") s.done += 1;
        map.set(a.user_id, s);
      });
      return (profs ?? [])
        .map((p) => {
          const s = map.get(p.id) ?? { total: 0, done: 0 };
          return { ...p, total: s.total, done: s.done, pct: s.total ? Math.round((s.done / s.total) * 100) : 0 };
        })
        .filter((p) => p.total > 0)
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 10);
    },
  });

  const cards = [
    { icon: Users, label: "Total members", value: stats?.members },
    { icon: ListChecks, label: "Total activities", value: stats?.activities },
    { icon: UserPlus, label: "Pending applications", value: stats?.pending },
    { icon: TrendingUp, label: "Overall engagement", value: `${stats?.engagement ?? 0}%` },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="fluent-card p-5">
            <c.icon className="h-5 w-5 text-primary" />
            <div className="mt-3 text-3xl font-bold">{c.value ?? "—"}</div>
            <div className="text-sm text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Leaderboard — top performers</h2>
        <div className="fluent-card overflow-hidden">
          {leaderboard.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No activity data yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="p-3">#</th><th className="p-3">Member</th><th className="p-3">ID</th><th className="p-3">Completed</th><th className="p-3">Progress</th></tr>
              </thead>
              <tbody>
                {leaderboard.map((m, i) => (
                  <tr key={m.id} className="border-t border-border">
                    <td className="p-3 font-bold">{i + 1}</td>
                    <td className="p-3">{m.full_name}</td>
                    <td className="p-3 text-muted-foreground">{m.member_id}</td>
                    <td className="p-3">{m.done}/{m.total}</td>
                    <td className="p-3"><span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">{m.pct}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
