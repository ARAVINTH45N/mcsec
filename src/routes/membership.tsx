import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { MsSquares } from "@/components/Logo";

export const Route = createFileRoute("/membership")({
  component: MembershipPage,
  head: () => ({ meta: [
    { title: "Join Microsoft Club SEC" },
    { name: "description", content: "Apply to join Microsoft Club SEC — the official Microsoft technology club of Saveetha Engineering College." },
  ] }),
});

const INTERESTS = ["AI/ML", "Cloud (Azure)", "Web Development", "Cybersecurity", "Power Platform", ".NET/C#", "DevOps", "IoT", "Data Science"];

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  register_no: z.string().trim().min(3).max(30),
  department: z.string().trim().min(2).max(60),
  year_of_study: z.string().min(1),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(6).max(20),
  reason: z.string().trim().min(10).max(1000),
  interests: z.array(z.string()).min(1, "Select at least one interest"),
});

function MembershipPage() {
  const [form, setForm] = useState({ name: "", register_no: "", department: "", year_of_study: "1", email: "", phone: "", reason: "" });
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (done) return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <div className="fluent-card p-10">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-2xl font-bold">Application submitted!</h1>
        <p className="mt-3 text-muted-foreground">Our team will review your application and reach out with next steps.</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          <MsSquares /> Membership
        </div>
        <h1 className="mt-3 text-3xl font-bold md:text-4xl">Join the club</h1>
        <p className="mt-2 text-muted-foreground">Tell us about yourself and what you'd like to explore.</p>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const parsed = schema.safeParse({ ...form, interests });
          if (!parsed.success) return toast.error(parsed.error.issues[0].message);
          setLoading(true);
          const { error } = await supabase.from("membership_applications").insert(parsed.data);
          setLoading(false);
          if (error) return toast.error(error.message);
          setDone(true);
        }}
        className="fluent-card space-y-4 p-6 md:p-8"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Full Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Register Number / Roll No.</Label><Input required value={form.register_no} onChange={(e) => setForm({ ...form, register_no: e.target.value })} /></div>
          <div><Label>Department</Label><Input required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
          <div><Label>Year of Study</Label>
            <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.year_of_study} onChange={(e) => setForm({ ...form, year_of_study: e.target.value })}>
              {["1","2","3","4"].map((y) => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div><Label>Email</Label><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>Phone</Label><Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        </div>
        <div>
          <Label>Why do you want to join?</Label>
          <Textarea required minLength={10} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={4} />
        </div>
        <div>
          <Label>Areas of interest</Label>
          <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
            {INTERESTS.map((i) => (
              <label key={i} className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2 text-sm hover:bg-accent">
                <Checkbox checked={interests.includes(i)} onCheckedChange={(v) => setInterests(v ? [...interests, i] : interests.filter((x) => x !== i))} />
                {i}
              </label>
            ))}
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit application
        </Button>
      </form>
    </div>
  );
}
