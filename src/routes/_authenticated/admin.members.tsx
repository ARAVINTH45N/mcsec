import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/members")({
  component: MembersAdmin,
});

function MembersAdmin() {
  const [q, setQ] = useState("");
  const { data: members = [] } = useQuery({
    queryKey: ["all_members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const filtered = members.filter((m) => {
    const s = q.toLowerCase();
    return !s || m.full_name?.toLowerCase().includes(s) || m.member_id?.toLowerCase().includes(s) || m.college_email?.toLowerCase().includes(s);
  });

  return (
    <div>
      <Input placeholder="Search by name, member ID or email" value={q} onChange={(e) => setQ(e.target.value)} className="mb-4 max-w-md" />
      <div className="fluent-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Member ID</th><th className="p-3">Name</th><th className="p-3">Department</th><th className="p-3">Year</th><th className="p-3">Email</th><th className="p-3">Phone</th></tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-t border-border">
                <td className="p-3 font-mono text-xs">{m.member_id}</td>
                <td className="p-3">{m.full_name}</td>
                <td className="p-3">{m.department}</td>
                <td className="p-3">{m.year_of_study}</td>
                <td className="p-3">{m.college_email}</td>
                <td className="p-3 text-muted-foreground">{m.phone}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No members found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
