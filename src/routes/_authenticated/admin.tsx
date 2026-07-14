import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Users, ListChecks, UserPlus, Image, MessageSquare, Settings, Bell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userData.user.id);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) throw redirect({ to: "/dashboard" });
  },
  component: AdminLayout,
});

const tabs: Array<{ to: string; label: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean }> = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/members", label: "Members", icon: Users },
  { to: "/admin/activities", label: "Activities", icon: ListChecks },
  { to: "/admin/applications", label: "Applications", icon: UserPlus },
  { to: "/admin/gallery", label: "Gallery", icon: Image },
  { to: "/admin/chat", label: "Chat mod", icon: MessageSquare },
  { to: "/admin/notifications-log", label: "Notif log", icon: Bell },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

function AdminLayout() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <h1 className="mb-6 text-2xl font-bold">Admin</h1>
      <div className="mb-8 flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to as unknown as "/admin"}
            activeOptions={{ exact: !!t.exact }}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
            activeProps={{ className: "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold bg-primary text-primary-foreground" }}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </Link>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
