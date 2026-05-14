"use client";

import Link from "next/link";
import { useState } from "react";
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
    <main className="grid min-h-screen place-items-center bg-muted/40 px-4">
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader>
          <CardTitle className="text-2xl">Create your account</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {magicSent ? (
            <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
              Check your inbox. Your setup link will open a live Relo workspace.
            </p>
          ) : (
            <form onSubmit={signup} className="grid gap-3">
              <Input name="name" placeholder="Your name" required />
              <Input name="email" type="email" placeholder="you@company.com" required />
              <Button type="submit">Start with magic link</Button>
            </form>
          )}
          <Button variant="outline" onClick={googleOAuth}>
            Continue with Google
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link href="/login" className="text-primary">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
