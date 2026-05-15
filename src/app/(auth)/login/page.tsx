"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Building2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { demoAccounts, type DemoAccount } from "@/lib/demo-accounts";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";

export default function LoginPage() {
  const refreshWorkspace = useAppStore((state) => state.refreshWorkspace);
  const [magicSent, setMagicSent] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function magicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${location.origin}/auth/callback?next=/dashboard/events` },
      });
      setMagicSent(true);
    }
  }

  async function googleOAuth() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?next=/dashboard/events` }
    });
  }

  async function demoLogin(account: DemoAccount) {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setError("");
    setDemoLoading(account.email);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    });
    setDemoLoading(null);

    if (signInError) {
      setError("Demo account is not seeded yet. Run npm run seed:demo-accounts, then try again.");
      return;
    }

    await refreshWorkspace();
    const workspace = useAppStore.getState();
    const firstEvent = workspace.events[0];
    const targetPath =
      account.role === "attendee"
        ? firstEvent
          ? `/events/${firstEvent.id || firstEvent.slug}`
          : "/setup"
        : "/dashboard/events";

    window.location.assign(targetPath);
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
            Use the admin demo for operations. Use the participant demo for matches, QR, and meetings.
          </p>
        </div>
      </section>

      <section className="grid place-items-center bg-background px-4 py-10">
        <Card className="w-full max-w-[480px] shadow-soft">
          <CardHeader>
            <CardTitle className="text-2xl">Sign in to Relo</CardTitle>
            <p className="text-sm text-muted-foreground">Choose the workspace type you need. Demo accounts route to different products.</p>
          </CardHeader>
          <CardContent className="grid gap-4">
            {magicSent ? (
              <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                Check your inbox. The sign-in link will open the correct Relo workspace.
              </p>
            ) : (
              <form onSubmit={magicLink} className="grid gap-3">
                <Input name="email" type="email" placeholder="you@company.com" required />
                <Button type="submit">
                  Send magic link <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            )}
            <Button variant="outline" onClick={googleOAuth}>
              Continue with Google
            </Button>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Seeded demo accounts</p>
              <div className="mt-3 grid gap-2">
                {demoAccounts.map((account) => {
                  const Icon = account.role === "attendee" ? UserRound : Building2;
                  return (
                    <Button
                      key={account.email}
                      type="button"
                      variant="secondary"
                      onClick={() => demoLogin(account)}
                      disabled={demoLoading !== null}
                      className="h-auto min-h-14 justify-start gap-3 px-3 py-3 text-left"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{account.label}</span>
                        <span className="block truncate text-xs font-normal opacity-70">
                          {demoLoading === account.email ? "Signing in..." : account.email}
                        </span>
                      </span>
                    </Button>
                  );
                })}
              </div>
              {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              New here? <Link href="/signup" className="text-primary">Create an account</Link>
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
