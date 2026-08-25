import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Users, Award, Rocket, MessageCircle, Linkedin, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MsSquares } from "@/components/Logo";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStorageUrl } from "@/lib/storage";
import campusBg from "@/assets/saveetha-campus.jpg.asset.json";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Microsoft Club SEC — Empowering Student Innovators" },
      { name: "description", content: "Join the official Microsoft technology club of Saveetha Engineering College — workshops, hackathons and a real community of student builders." },
    ],
  }),
});

function Home() {
  const { data: settings } = useSiteSettings();
  const { data: heroBg } = useStorageUrl("site-assets", settings?.hero_bg_url);
  const heroImage = heroBg ?? campusBg.url;
  const { data: stats } = useQuery({
    queryKey: ["home_stats"],
    queryFn: async () => {
      const [members, activities, gallery] = await Promise.all([
        supabase.from("member_directory").select("id", { count: "exact", head: true }),
        supabase.from("activities").select("id", { count: "exact", head: true }),
        supabase.from("gallery_posts").select("id", { count: "exact", head: true }),
      ]);
      return {
        members: members.count ?? 0,
        activities: activities.count ?? 0,
        events: gallery.count ?? 0,
      };
    },
  });

  return (
    <div>
      
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: "var(--gradient-hero)",
            backgroundImage: `linear-gradient(135deg, oklch(0.15 0.05 260 / 0.9), oklch(0.28 0.09 255 / 0.85)), url(${heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-24 text-navy-foreground md:grid-cols-2 md:px-6 md:py-32">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs backdrop-blur">
              <MsSquares className="h-3 w-3" />
              <span className="font-medium">Saveetha Engineering College</span>
            </div>
            <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              {settings?.hero_title ?? "Microsoft Club SEC"}
            </h1>
            <p className="mt-6 max-w-lg text-lg text-white/80">
              {settings?.hero_subtitle ?? "Where students meet Microsoft technologies — build, learn, and lead through workshops, hackathons and community."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/membership">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                  Join Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/activities">
                <Button size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                  View Activities
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative hidden md:block">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 to-transparent p-8 backdrop-blur">
              <div className="grid h-full grid-cols-2 gap-4">
                {[
                  { c: "var(--color-ms-red)", label: "Learn" },
                  { c: "var(--color-ms-green)", label: "Build" },
                  { c: "var(--color-ms-blue)", label: "Connect" },
                  { c: "var(--color-ms-yellow)", label: "Lead" },
                ].map((t) => (
                  <div key={t.label} className="flex items-end rounded-2xl p-6 shadow-fluent" style={{ backgroundColor: t.c }}>
                    <span className="text-2xl font-bold text-white">{t.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pointer-events-none aspect-square" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto -mt-12 max-w-7xl px-4 md:px-6">
        <div className="fluent-card grid grid-cols-3 divide-x divide-border p-4 md:p-8">
          {[
            { icon: Users, label: "Members", value: stats?.members ?? "—" },
            { icon: Sparkles, label: "Activities", value: stats?.activities ?? "—" },
            { icon: Award, label: "Events Captured", value: stats?.events ?? "—" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-2 px-2 text-center">
              <s.icon className="h-6 w-6 text-primary" />
              <div className="text-2xl font-bold md:text-3xl">{s.value}</div>
              <div className="text-xs text-muted-foreground md:text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <div className="grid gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <MsSquares /> About Us
            </div>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">Building the next generation of Microsoft technologists</h2>
            <p className="mt-4 text-muted-foreground">
              Microsoft Club SEC is a student-run community dedicated to nurturing curiosity, technical
              excellence and collaboration around the Microsoft ecosystem — Azure, AI, .NET, Power
              Platform, Cybersecurity, and beyond.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Rocket, title: "Our Mission", body: "Equip every member with the practical skills and real-world exposure to thrive in tech." },
              { icon: Sparkles, title: "Our Vision", body: "A campus community where innovation, mentorship and Microsoft technologies converge." },
            ].map((c) => (
              <div key={c.title} className="fluent-card fluent-card-hover p-6">
                <c.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-3 font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Connect */}
      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-6">
        <div className="fluent-card overflow-hidden">
          <div className="grid gap-0 md:grid-cols-[1fr_auto] md:items-center">
            <div className="p-8 md:p-12">
              <h2 className="text-2xl font-bold md:text-3xl">Connect with us</h2>
              <p className="mt-2 max-w-md text-muted-foreground">
                Join our WhatsApp community, follow us on LinkedIn, or drop us a line.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 p-8 md:p-12">
              {settings?.whatsapp_url && (
                <a href={settings.whatsapp_url} target="_blank" rel="noreferrer">
                  <Button variant="default" size="lg"><MessageCircle className="mr-2 h-4 w-4" /> WhatsApp</Button>
                </a>
              )}
              {settings?.linkedin_url && (
                <a href={settings.linkedin_url} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="lg"><Linkedin className="mr-2 h-4 w-4" /> LinkedIn</Button>
                </a>
              )}
              {settings?.contact_email && (
                <a href={`mailto:${settings.contact_email}`}>
                  <Button variant="outline" size="lg"><Mail className="mr-2 h-4 w-4" /> Email us</Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
