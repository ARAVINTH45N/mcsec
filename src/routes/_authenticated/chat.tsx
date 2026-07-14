import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatPage,
  head: () => ({ meta: [{ title: "Community Chat — Microsoft Club SEC" }] }),
});

interface Msg {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: { full_name: string; member_id: string; avatar_url: string | null } | null;
}

function ChatPage() {
  const { user } = useSession();
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAdmin = useQuery({
    queryKey: ["is_admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user!.id);
      return (data ?? []).some((r) => r.role === "admin");
    },
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["chat_messages"],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, content, created_at, user_id, profiles(full_name, member_id, avatar_url)")
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: true })
        .limit(500);
      if (error) throw error;
      return data as unknown as Msg[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("chat_stream")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_messages" }, () => {
        qc.invalidateQueries({ queryKey: ["chat_messages"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    if (!content.trim() || !user) return;
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({ user_id: user.id, content: content.trim().slice(0, 1000) });
    setSending(false);
    if (error) return toast.error(error.message);
    setContent("");
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("chat_messages").delete().eq("id", id);
    if (error) toast.error(error.message);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col px-4 py-6 md:px-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Community chat</h1>
        <p className="text-xs text-muted-foreground">Showing messages from the last 7 days · live updates</p>
      </div>
      <div ref={scrollRef} className="fluent-card flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">Be the first to say hi 👋</div>
        ) : (
          messages.map((m) => {
            const mine = m.user_id === user?.id;
            return (
              <div key={m.id} className={`flex gap-3 ${mine ? "flex-row-reverse" : ""}`}>
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {m.profiles?.full_name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${mine ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
                  <div className="mb-0.5 flex items-baseline gap-2 text-[10px] opacity-70">
                    <span className="font-semibold">{m.profiles?.full_name ?? "Member"}</span>
                    <span>{m.profiles?.member_id}</span>
                    <span>· {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</span>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm">{m.content}</p>
                  {(mine || isAdmin.data) && (
                    <button onClick={() => del(m.id)} className="mt-1 text-[10px] opacity-60 hover:opacity-100">
                      <Trash2 className="inline h-3 w-3" /> delete
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-4 flex gap-2">
        <Input placeholder="Type a message…" maxLength={1000} value={content} onChange={(e) => setContent(e.target.value)} />
        <Button type="submit" disabled={sending || !content.trim()}><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}
