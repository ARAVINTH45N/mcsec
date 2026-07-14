import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Logo, MsSquares } from "@/components/Logo";
import { Loader2 } from "lucide-react";

const searchSchema = z.object({ tab: z.enum(["login", "register", "forgot"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  component: AuthPage,
  head: () => ({ meta: [{ title: "Sign in — Microsoft Club SEC" }, { name: "description", content: "Login or register for Microsoft Club SEC." }] }),
});

const registerSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  college_email: z.string().trim().email().max(255),
  phone: z.string().trim().min(6).max(20),
  department: z.string().trim().min(2).max(60),
  year_of_study: z.string().min(1),
  password: z.string().min(6).max(72),
});

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const initial = search.tab ?? "login";
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center px-4 py-12">
      <div className="mb-6 flex flex-col items-center">
        <Logo size={56} showText={false} />
        <h1 className="mt-4 text-2xl font-bold">Microsoft Club SEC</h1>
        <p className="text-sm text-muted-foreground">Sign in to your member portal</p>
      </div>
      <div className="fluent-card w-full p-6">
        <Tabs defaultValue={initial}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
            <TabsTrigger value="forgot">Forgot</TabsTrigger>
          </TabsList>
          <TabsContent value="login"><LoginForm /></TabsContent>
          <TabsContent value="register"><RegisterForm /></TabsContent>
          <TabsContent value="forgot"><ForgotForm /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (error) return toast.error(error.message);
        toast.success("Welcome back!");
        navigate({ to: "/dashboard" });
      }}
      className="mt-6 space-y-4"
    >
      <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div><Label>Password</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign in
      </Button>
    </form>
  );
}

function RegisterForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [form, setForm] = useState({ full_name: "", college_email: "", phone: "", department: "", year_of_study: "1", password: "" });

  if (memberId) {
    return (
      <div className="mt-6 space-y-4 text-center">
        <MsSquares className="mx-auto h-8 w-8" />
        <h3 className="text-lg font-semibold">Welcome to the club!</h3>
        <p className="text-sm text-muted-foreground">Your unique Member ID</p>
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 py-4 text-2xl font-bold tracking-wider text-primary">{memberId}</div>
        <p className="text-xs text-muted-foreground">Save this. Please check your email to verify your account, then sign in.</p>
        <Button onClick={() => navigate({ to: "/auth", search: { tab: "login" } })} className="w-full">Continue to Sign In</Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const parsed = registerSchema.safeParse(form);
        if (!parsed.success) return toast.error(parsed.error.issues[0].message);
        setLoading(true);
        const { data, error } = await supabase.auth.signUp({
          email: form.college_email,
          password: form.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: form.full_name,
              college_email: form.college_email,
              phone: form.phone,
              department: form.department,
              year_of_study: form.year_of_study,
            },
          },
        });
        setLoading(false);
        if (error) return toast.error(error.message);
        // Fetch member id — profile is created by trigger
        if (data.user) {
          const { data: prof } = await supabase.from("profiles").select("member_id").eq("id", data.user.id).maybeSingle();
          setMemberId(prof?.member_id ?? "MCSEC-PENDING");
        }
      }}
      className="mt-6 space-y-3"
    >
      <div><Label>Full Name</Label><Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
      <div><Label>College Email</Label><Input type="email" required value={form.college_email} onChange={(e) => setForm({ ...form, college_email: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Phone</Label><Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div><Label>Year</Label>
          <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.year_of_study} onChange={(e) => setForm({ ...form, year_of_study: e.target.value })}>
            {["1","2","3","4"].map((y) => <option key={y} value={y}>Year {y}</option>)}
          </select>
        </div>
      </div>
      <div><Label>Department</Label><Input required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. CSE / IT / ECE" /></div>
      <div><Label>Password</Label><Input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Account
      </Button>
    </form>
  );
}

function ForgotForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        setLoading(false);
        if (error) return toast.error(error.message);
        setSent(true);
      }}
      className="mt-6 space-y-4"
    >
      {sent ? (
        <p className="text-sm text-muted-foreground">If an account exists, a reset link has been sent to {email}.</p>
      ) : (
        <>
          <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send reset link
          </Button>
        </>
      )}
      <Link to="/auth" search={{ tab: "login" }} className="block text-center text-xs text-muted-foreground hover:text-primary">Back to sign in</Link>
    </form>
  );
}
