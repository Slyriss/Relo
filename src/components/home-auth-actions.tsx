"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { appHomeForUser } from "@/lib/navigation";
import { useAppStore } from "@/lib/store";

export function HomeAuthActions({ compact = false }: { compact?: boolean }) {
  const user = useAppStore((state) => state.user);
  const events = useAppStore((state) => state.events);
  const attendees = useAppStore((state) => state.attendees);
  const href = user ? appHomeForUser(user, events, attendees) : "/signup";

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {!user ? (
          <Button asChild variant="secondary" className="hidden sm:inline-flex">
            <Link href="/signup">Request access</Link>
          </Button>
        ) : null}
        <Button asChild>
          <Link href={user ? href : "/login"}>{user ? "Open Relo" : "Sign in"}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <Button asChild size="lg" className="bg-emerald-300 text-[#08111f] hover:bg-emerald-200">
        <Link href={href}>
          {user ? "Open your workspace" : "Request access"} <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
      {!user ? (
        <Button asChild size="lg" variant="outline" className="border-white/25 bg-white/10 text-white hover:bg-white/15">
          <Link href="/login">Sign in</Link>
        </Button>
      ) : null}
    </div>
  );
}
