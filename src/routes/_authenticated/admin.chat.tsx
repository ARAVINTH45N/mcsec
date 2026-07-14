import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin/chat")({
  component: ChatMod,
});

function ChatMod() {
  const qc = useQueryClient();
  const { data: messages = [] } = useQuery({
    queryKey: ["admin_chat"],
    queryFn: async () => (await supabase.from("chat_messages").select("*, profiles(full_name, member_id)").order("created_at", { ascending: false }).limit(200)).data as unknown as Array<{ id: string; content: string; created_at: string; profiles: { full_name: string; member_id: string } | null }>,
  });
  const del = async (id: string) => {
    const { error } = await supabase.from("chat_messages").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Message removed"); qc.invalidateQueries({ queryKey: ["admin_chat"] }); }
  };
  return (
    <div className="grid gap-2">
      {messages.map((m) => (
        <div key={m.id} className="fluent-card flex items-start justify-between gap-3 p-4">
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">
              <b>{m.profiles?.full_name ?? "?"}</b> {m.profiles?.member_id} · {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
            </div>
            <p className="mt-1 text-sm">{m.content}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={() => del(m.id)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
      {messages.length === 0 && <div className="fluent-card p-12 text-center text-muted-foreground">No messages</div>}
    </div>
  );
}
