"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { Input } from "@/components/ui/input";
import { appHomeForUser } from "@/lib/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";

export default function SignupPage() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const events = useAppStore((state) => state.events);
  const attendees = useAppStore((state) => state.attendees);
  const loadingWorkspace = useAppStore((state) => state.loadingWorkspace);
  const refreshWorkspace = useAppStore((state) => state.refreshWorkspace);
  const [pendingEmail, setPendingEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && !loadingWorkspace) router.replace(appHomeForUser(user, events, attendees));
  }, [attendees, events, loadingWorkspace, router, user]);

  async function signup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name"));
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      setError("");
      setLoading(true);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${location.origin}/auth/callback?next=/setup`,
        },
      });
      if (signUpError) {
        setLoading(false);
        setError(signUpError.message.includes("already registered") ? "This email already has an account. Sign in instead." : "Could not create this account.");
        return;
      }
      if (data.session) {
        await refreshWorkspace();
        router.replace("/setup");
        return;
      }
      setPendingEmail(true);
      setLoading(false);
    }
  }

  async function googleOAuth() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?next=/setup` },
    });
  }

  return (
    <main
      className="relative grid min-h-screen place-items-center overflow-hidden bg-[#07111f] px-4 py-10"
      style={{ backgroundImage: "url('/relo-assets/landing-hero-mesh.png')", backgroundPosition: "center", backgroundSize: "cover" }}
    >
      <div className="absolute inset-0 bg-[#07111f]/72" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#07111f] to-transparent" />
      <Card className="relative z-10 w-full max-w-md border-white/20 bg-white/95 shadow-2xl backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <p className="text-sm text-muted-foreground">
            Create an admin workspace with email or Google. Participants should use their event invite.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4">
          {pendingEmail ? (
            <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
              <p className="flex items-center gap-2 font-semibold text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Check your email
              </p>
              <p className="mt-2">Confirm your email, then come back here and sign in with your password.</p>
            </div>
          ) : (
            <form onSubmit={signup} className="grid gap-3">
              <Input name="name" placeholder="Your name" required />
              <Input name="email" type="email" placeholder="you@company.com" autoComplete="email" required />
              <Input
                name="password"
                type="password"
                placeholder="Create a password"
                autoComplete="new-password"
                minLength={8}
                required
              />
              {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
              <Button type="submit" disabled={loading}>
                {loading ? "Creating account..." : "Create account"} <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}
          <GoogleAuthButton onClick={googleOAuth} />
          <p className="-mt-2 text-xs text-muted-foreground">
            Google sign-up can use your Google name, email, and profile photo for your Relo profile.
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link href="/login" className="text-primary">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
