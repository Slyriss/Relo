"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { Input } from "@/components/ui/input";
import { mapSignupError, passwordValidationMessage } from "@/lib/auth/messages";
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
  const formRef = useRef<HTMLFormElement>(null);
  const [pendingEmail, setPendingEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const passwordsMismatch = Boolean(confirmPassword && password !== confirmPassword);

  useEffect(() => {
    if (user && !loadingWorkspace) router.replace(appHomeForUser(user, events, attendees));
  }, [attendees, events, loadingWorkspace, router, user]);

  async function signup() {
    const formData = formRef.current ? new FormData(formRef.current) : null;
    const submittedName = String(formData?.get("name") ?? "").trim();
    const submittedEmail = String(formData?.get("email") ?? "").trim();
    const submittedPassword = String(formData?.get("password") ?? password);
    const submittedConfirm = String(formData?.get("confirmPassword") ?? confirmPassword);
    const passwordError = passwordValidationMessage(submittedPassword);

    setError("");
    if (!submittedName || !submittedEmail) {
      setError("Enter your name and work email to continue.");
      return;
    }

    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (submittedPassword !== submittedConfirm) {
      setError("Passwords do not match.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      setLoading(true);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: submittedEmail,
        password: submittedPassword,
        options: {
          data: { name: submittedName },
          emailRedirectTo: `${location.origin}/auth/callback?next=/setup`,
        },
      });
      if (signUpError) {
        setLoading(false);
        setError(mapSignupError(signUpError.message));
        return;
      }
      if (data.session) {
        await refreshWorkspace();
        router.replace("/setup");
        return;
      }
      setPendingEmail(true);
      setLoading(false);
      return;
    }

    setError("Authentication is not configured for this environment.");
  }

  async function googleOAuth() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setError("");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?next=/setup` },
    });
    if (oauthError) setError(mapSignupError(oauthError.message));
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
          <CardTitle className="text-2xl">Request your Relo account</CardTitle>
          <p className="text-sm text-muted-foreground">
            Create an admin workspace with email or Google. Participants should use the invitation from their event team.
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
            <form ref={formRef} method="post" action="#" onSubmit={(event) => event.preventDefault()} className="grid gap-3">
              <Input name="name" placeholder="Your name" required />
              <Input
                name="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
              <div className="space-y-1">
                <div className="relative">
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
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
                <p className={password && password.length < 8 ? "text-xs font-medium text-destructive" : "text-xs text-muted-foreground"}>
                  Use at least 8 characters.
                </p>
              </div>
              <div className="relative">
                <Input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void signup();
                  }}
                  className="pr-11"
                  required
                />
                <button
                  type="button"
                  aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordsMismatch ? <p className="-mt-2 text-xs font-medium text-destructive">Passwords do not match.</p> : null}
              {error ? (
                <div role="alert" className="flex gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}
              <Button type="button" onClick={signup} disabled={loading}>
                {loading ? "Creating account..." : "Create account"} <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-xs leading-5 text-muted-foreground">
                By continuing, you agree to use Relo for consented event operations and to follow your organization&apos;s attendee data policy.
              </p>
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
