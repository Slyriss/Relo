"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const loginDemo = useAppStore((state) => state.loginDemo);
  const [magicSent, setMagicSent] = useState(false);

  async function magicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/dashboard` } });
      setMagicSent(true);
    }
  }

  async function googleOAuth() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/dashboard` }
    });
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
          <Button
            variant="secondary"
            onClick={() => {
              loginDemo();
              router.push("/dashboard/events");
            }}
          >
            Use demo access
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            New here? <Link href="/signup" className="text-primary">Create an account</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
