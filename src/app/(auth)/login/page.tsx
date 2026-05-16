"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowRight, Eye, EyeOff } from "lucide-react";
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
  const formRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function nextPath() {
    if (typeof window === "undefined") return "";
    const next = new URLSearchParams(window.location.search).get("next");
    return next?.startsWith("/") && !next.startsWith("//") ? next : "";
  }

  useEffect(() => {
    if (user && !loadingWorkspace) router.replace(nextPath() || appHomeForUser(user, events, attendees));
  }, [attendees, events, loadingWorkspace, router, user]);

  async function passwordLogin() {
    const formData = formRef.current ? new FormData(formRef.current) : null;
    const submittedEmail = String(formData?.get("email") ?? email).trim();
    const submittedPassword = String(formData?.get("password") ?? "");

    if (!submittedEmail || !submittedPassword) {
      setError("Enter your email and password to continue.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Authentication is not configured for this environment.");
      return;
    }

    setError("");
    setNotice("");
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: submittedEmail, password: submittedPassword });
    if (signInError) {
      setLoading(false);
      setError("Could not sign in. Check your email and password.");
      return;
    }

    await refreshWorkspace();
    const workspace = useAppStore.getState();
    if (workspace.user) router.replace(nextPath() || appHomeForUser(workspace.user, workspace.events, workspace.attendees));
    setLoading(false);
  }

  async function sendPasswordReset() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Authentication is not configured for this environment.");
      return;
    }

    const submittedEmail = String(formRef.current ? new FormData(formRef.current).get("email") : email).trim();
    if (!submittedEmail) {
      setError("Enter your email first, then request a password reset.");
      return;
    }

    setError("");
    setNotice("");
    setResetLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(submittedEmail, {
      redirectTo: `${location.origin}/auth/callback?next=/settings/profile`,
    });
    setResetLoading(false);

    if (resetError) {
      setError("Could not send a reset email. Check the address and try again.");
      return;
    }

    setNotice("Password reset email sent. Check your inbox for the secure link.");
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
          <p className="text-sm font-medium uppercase text-emerald-100">Role-aware event intelligence</p>
          <h1 className="mt-4 text-5xl font-semibold leading-tight tracking-normal">Open the right workspace every time.</h1>
          <p className="mt-5 text-lg leading-8 text-white/76">
            Organizers manage operations and live research. Participants enter their event pass, matches, QR scan, and meeting notes.
          </p>
        </div>
      </section>

      <section className="grid place-items-center bg-background px-4 py-10">
        <Card className="w-full max-w-[480px] shadow-soft">
          <CardHeader>
            <CardTitle className="text-2xl">Sign in to Relo</CardTitle>
            <p className="text-sm text-muted-foreground">Use your account password or Google. Relo opens the correct admin or participant workspace for your role.</p>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form ref={formRef} method="post" action="#" onSubmit={(event) => event.preventDefault()} className="grid gap-3">
              <Input
                name="email"
                type="email"
                aria-label="Email"
                placeholder="you@company.com"
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  aria-label="Password"
                  placeholder="Password"
                  autoComplete="current-password"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void passwordLogin();
                  }}
                  className="pr-11"
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="-mt-1 flex justify-end">
                <button
                  type="button"
                  onClick={sendPasswordReset}
                  disabled={resetLoading}
                  className="text-xs font-medium text-primary hover:underline disabled:pointer-events-none disabled:opacity-60"
                >
                  {resetLoading ? "Sending reset..." : "Forgot password?"}
                </button>
              </div>
              {error ? (
                <div role="alert" className="flex gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}
              {notice ? (
                <div role="status" className="rounded-lg border border-emerald-500/20 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {notice}
                </div>
              ) : null}
              <Button type="button" onClick={passwordLogin} disabled={loading}>
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
