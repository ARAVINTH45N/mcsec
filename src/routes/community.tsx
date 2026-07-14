import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquare, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useAuth";

export const Route = createFileRoute("/community")({
  component: CommunityPage,
  head: () => ({ meta: [{ title: "Community — Microsoft Club SEC" }, { name: "description", content: "Real-time community chat for Microsoft Club SEC members." }] }),
});

function CommunityPage() {
  const { user } = useSession();
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 md:px-6">
      <div className="fluent-card p-10 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
          <MessageSquare className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-3xl font-bold">Community Discussion</h1>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          A club-wide real-time chat for all members. Ask questions, share resources, and connect with peers.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {user ? (
            <Link to="/chat"><Button size="lg"><MessageSquare className="mr-2 h-4 w-4" /> Open Chat</Button></Link>
          ) : (
            <>
              <Link to="/auth"><Button size="lg"><Users className="mr-2 h-4 w-4" /> Sign in to chat</Button></Link>
              <Link to="/membership"><Button size="lg" variant="outline">Become a member</Button></Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
