import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin/notifications-log")({
  component: NotifLog,
});

function NotifLog() {
  const { data: log = [] } = useQuery({
    queryKey: ["notif_log"],
    queryFn: async () => (await supabase.from("notifications").select("*, profiles(full_name, member_id)").order("created_at", { ascending: false }).limit(200)).data as unknown as Array<{ id: string; title: string; body: string; created_at: string; read: boolean; profiles: { full_name: string; member_id: string } | null }>,
  });
  return (
    <div className="fluent-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
          <tr><th className="p-3">Sent</th><th className="p-3">Recipient</th><th className="p-3">Title</th><th className="p-3">Read</th></tr>
        </thead>
        <tbody>
          {log.map((n) => (
            <tr key={n.id} className="border-t border-border">
              <td className="p-3 text-muted-foreground">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</td>
              <td className="p-3">{n.profiles?.full_name} <span className="text-xs text-muted-foreground">{n.profiles?.member_id}</span></td>
              <td className="p-3">{n.title}</td>
              <td className="p-3">{n.read ? "✓" : "—"}</td>
            </tr>
          ))}
          {log.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No notifications sent yet</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
