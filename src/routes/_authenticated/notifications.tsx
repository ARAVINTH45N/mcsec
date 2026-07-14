import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useAuth";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotifPage,
  head: () => ({ meta: [{ title: "Notifications — Microsoft Club SEC" }] }),
});

function NotifPage() {
  const { user } = useSession();
  const qc = useQueryClient();
  const { data: notifs = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
    qc.invalidateQueries({ queryKey: ["notifications_unread", user?.id] });
  };

  const markAll = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    qc.invalidateQueries({ queryKey: ["notifications", user.id] });
    qc.invalidateQueries({ queryKey: ["notifications_unread", user.id] });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {notifs.some((n) => !n.read) && <Button variant="outline" size="sm" onClick={markAll}><Check className="mr-2 h-4 w-4" /> Mark all read</Button>}
      </div>
      {notifs.length === 0 ? (
        <div className="fluent-card flex flex-col items-center gap-3 p-16 text-center">
          <Bell className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No notifications yet</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {notifs.map((n) => {
            const inner = (
              <div className={`fluent-card p-4 transition ${!n.read ? "border-primary/40 bg-primary/5" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-muted-foreground/30" : "bg-primary"}`} />
                  <div className="flex-1">
                    <h3 className="font-semibold">{n.title}</h3>
                    {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                  </div>
                </div>
              </div>
            );
            return n.link ? (
              <Link key={n.id} to={n.link} onClick={() => markRead(n.id)}>{inner}</Link>
            ) : (
              <button key={n.id} onClick={() => markRead(n.id)} className="text-left">{inner}</button>
            );
          })}
        </div>
      )}
    </div>
  );
}
