"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [magicSent, setMagicSent] = useState(false);

  async function signup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name"));
    const email = String(formData.get("email"));
    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signInWithOtp({
        email,
        options: {
          data: { name },
          emailRedirectTo: `${location.origin}/auth/callback?next=/setup`,
        },
      });
      setMagicSent(true);
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
    <main className="grid min-h-screen place-items-center bg-[#08111f] px-4 py-10">
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <p className="text-sm text-muted-foreground">Start an admin workspace for event operations. Participants should use their event invite.</p>
        </CardHeader>
        <CardContent className="grid gap-4">
          {magicSent ? (
            <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
              <p className="flex items-center gap-2 font-semibold text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Workspace link sent
              </p>
              <p className="mt-2">Open the email on this device to finish creating the admin workspace.</p>
            </div>
          ) : (
            <form onSubmit={signup} className="grid gap-3">
              <Input name="name" placeholder="Your name" required />
              <Input name="email" type="email" placeholder="you@company.com" required />
              <Button type="submit">
                Start with magic link <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}
          <Button variant="outline" onClick={googleOAuth}>
            Continue with Google
          </Button>
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
