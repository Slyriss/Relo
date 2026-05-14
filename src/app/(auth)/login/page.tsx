"use client";

import Link from "next/link";
import { useState } from "react";
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
    <main className="grid min-h-screen place-items-center bg-muted/40 px-4">
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader>
          <CardTitle className="text-2xl">Sign in to Relo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {magicSent ? (
            <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
              Check your inbox — we sent you a magic link.
            </p>
          ) : (
            <form onSubmit={magicLink} className="grid gap-3">
              <Input name="email" type="email" placeholder="you@company.com" required />
              <Button type="submit">Send magic link</Button>
            </form>
          )}
          <Button variant="outline" onClick={googleOAuth}>
            Continue with Google
          </Button>
          <div className="rounded-xl border bg-muted/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Demo accounts</p>
            <div className="mt-3 grid gap-2">
              {demoAccounts.map((account) => (
                <Button
                  key={account.email}
                  type="button"
                  variant="secondary"
                  onClick={() => demoLogin(account)}
                  disabled={demoLoading !== null}
                  className="justify-between"
                >
                  <span>{account.label}</span>
                  <span className="text-xs font-normal opacity-70">
                    {demoLoading === account.email ? "Signing in..." : account.email}
                  </span>
                </Button>
              ))}
            </div>
            {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            New here? <Link href="/signup" className="text-primary">Create an account</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
