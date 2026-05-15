"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { Input } from "@/components/ui/input";
import { appHomeForUser } from "@/lib/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const events = useAppStore((state) => state.events);
  const attendees = useAppStore((state) => state.attendees);
  const loadingWorkspace = useAppStore((state) => state.loadingWorkspace);
  const refreshWorkspace = useAppStore((state) => state.refreshWorkspace);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && !loadingWorkspace) router.replace(appHomeForUser(user, events, attendees));
  }, [attendees, events, loadingWorkspace, router, user]);

  async function passwordLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setError("");
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setLoading(false);
      setError("Could not sign in. Check your email and password.");
      return;
    }

    await refreshWorkspace();
    const workspace = useAppStore.getState();
    if (workspace.user) router.replace(appHomeForUser(workspace.user, workspace.events, workspace.attendees));
    setLoading(false);
  }

  async function googleOAuth() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?next=/setup` }
    });
  }

  return (
    <main className="grid min-h-screen bg-[#07111f] lg:grid-cols-[0.95fr_1.05fr]">
      <section
        className="relative hidden overflow-hidden bg-cover bg-center p-10 text-white lg:flex lg:flex-col lg:justify-between"
        style={{ backgroundImage: "url('/relo-assets/login-hero-left.png')" }}
      >
        <div className="absolute inset-0 bg-[#07111f]/52" />
        <Link href="/" className="relative z-10 flex items-center gap-3 text-sm font-semibold">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-emerald-300 text-[#07111f]">R</span>
          Relo
        </Link>
        <div className="relative z-10 max-w-lg">
          <p className="text-sm font-medium uppercase text-emerald-100">Two products, one account boundary</p>
          <h1 className="mt-4 text-5xl font-semibold leading-tight tracking-normal">Admin control is separate from the participant event space.</h1>
          <p className="mt-5 text-lg leading-8 text-white/76">
            Admins go to event operations. Participants go to their event pass, matches, QR, and meetings.
          </p>
        </div>
      </section>

      <section className="grid place-items-center bg-background px-4 py-10">
        <Card className="w-full max-w-[480px] shadow-soft">
          <CardHeader>
            <CardTitle className="text-2xl">Sign in to Relo</CardTitle>
            <p className="text-sm text-muted-foreground">Use your account password or Google. Relo will open the right workspace for your role.</p>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form onSubmit={passwordLogin} className="grid gap-3">
              <Input name="email" type="email" aria-label="Email" placeholder="you@company.com" autoComplete="email" required />
              <Input name="password" type="password" aria-label="Password" placeholder="Password" autoComplete="current-password" required />
              {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
              <Button type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"} <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
            <GoogleAuthButton onClick={googleOAuth} />
            <p className="-mt-2 text-xs text-muted-foreground">
              Google sign-in can use your Google name, email, and profile photo for your Relo profile.
            </p>
            <p className="text-center text-sm text-muted-foreground">
              New here? <Link href="/signup" className="text-primary">Create an account</Link>
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
