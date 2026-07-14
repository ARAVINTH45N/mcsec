import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, FileText, Link as LinkIcon, Sparkles } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/activities")({
  component: ActivitiesPublic,
  head: () => ({ meta: [
    { title: "Activities — Microsoft Club SEC" },
    { name: "description", content: "Workshops, hackathons and learning activities from Microsoft Club SEC." },
  ] }),
});

function ActivitiesPublic() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["activities_public"],
    queryFn: async () => {
      const { data, error } = await supabase.from("activities").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
      <div className="mb-10 flex flex-col gap-2">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          <Sparkles className="h-3 w-3" /> Activities
        </div>
        <h1 className="text-3xl font-bold md:text-4xl">Learn, build and level up</h1>
        <p className="max-w-2xl text-muted-foreground">Explore all workshops, hackathons and learning tracks running in the club.</p>
      </div>
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="fluent-card h-48 animate-pulse" />)}
        </div>
      ) : !activities?.length ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activities.map((a) => (
            <div key={a.id} className="fluent-card fluent-card-hover p-6">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                {a.category}
              </div>
              <h3 className="text-lg font-semibold">{a.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{a.description}</p>
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                {a.deadline && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(a.deadline), "MMM d, yyyy")}</span>}
                {Array.isArray(a.resource_links) && a.resource_links.length > 0 && (
                  <span className="inline-flex items-center gap-1"><LinkIcon className="h-3 w-3" />{a.resource_links.length} resources</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="fluent-card flex flex-col items-center gap-3 p-16 text-center">
      <FileText className="h-10 w-10 text-muted-foreground" />
      <h3 className="font-semibold">No activities yet</h3>
      <p className="text-sm text-muted-foreground">Check back soon — new workshops are always being planned.</p>
    </div>
  );
}
