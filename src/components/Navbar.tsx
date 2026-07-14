import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, LogOut, Menu, X, LayoutDashboard, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useProfile, useSession } from "@/hooks/useAuth";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const publicLinks = [
  { to: "/", label: "Home" },
  { to: "/activities", label: "Activities" },
  { to: "/gallery", label: "Gallery" },
  { to: "/community", label: "Community" },
  { to: "/membership", label: "Membership" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useSession();
  const { data: profile } = useProfile(user);
  const { data: isAdmin } = useIsAdmin(user);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications_unread", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      return count ?? 0;
    },
  });

  // Realtime notifications
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notif:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as { title: string };
          toast(n.title, { description: "New notification" });
          qc.invalidateQueries({ queryKey: ["notifications_unread", user.id] });
          qc.invalidateQueries({ queryKey: ["notifications", user.id] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  const handleLogout = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link to="/" className="shrink-0">
          <Logo size={36} />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {publicLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "rounded-md px-3 py-2 text-sm font-semibold text-primary bg-primary/10" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                to="/notifications"
                className="relative hidden rounded-full p-2 text-foreground/70 hover:bg-accent md:inline-flex"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
              {isAdmin && (
                <Link to="/admin">
                  <Button size="sm" variant="outline" className="hidden md:inline-flex">
                    <Shield className="mr-1.5 h-4 w-4" /> Admin
                  </Button>
                </Link>
              )}
              <Link to="/dashboard" className="hidden md:inline-flex">
                <Button size="sm" variant="secondary">
                  <LayoutDashboard className="mr-1.5 h-4 w-4" /> Dashboard
                </Button>
              </Link>
              <Link to="/profile" className="hidden items-center gap-2 rounded-full border border-border bg-card px-2 py-1 hover:bg-accent md:inline-flex">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {profile?.full_name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? "M"}
                </div>
                <span className="max-w-28 truncate text-xs font-medium">{profile?.member_id ?? "…"}</span>
              </Link>
              <Button size="icon" variant="ghost" onClick={handleLogout} className="hidden md:inline-flex" title="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link to="/auth" className="hidden md:inline-flex">
              <Button size="sm">Login / Join</Button>
            </Link>
          )}

          <button
            onClick={() => setOpen(!open)}
            className="rounded-md p-2 md:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="flex flex-col gap-1 p-4">
            {publicLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">Dashboard</Link>
                <Link to="/notifications" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">
                  Notifications {unreadCount > 0 && <span className="ml-1 rounded-full bg-destructive px-1.5 text-[10px] text-destructive-foreground">{unreadCount}</span>}
                </Link>
                <Link to="/profile" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">Profile</Link>
                {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">Admin</Link>}
                <button onClick={handleLogout} className="rounded-md px-3 py-2 text-left text-sm font-medium text-destructive hover:bg-accent">Sign out</button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">Login / Join</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
