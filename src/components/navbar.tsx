"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { CalendarDays, LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "@/components/profile-avatar";
import { useAppStore } from "@/lib/store";
import { appHomeForUser } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function Navbar() {
  const user = useAppStore((s) => s.user);
  const events = useAppStore((s) => s.events);
  const attendees = useAppStore((s) => s.attendees);
  const logout = useAppStore((s) => s.logout);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isAttendee = user?.role === "attendee";
  const participantEvent = isAttendee
    ? events.find((event) =>
        attendees.some(
          (attendee) =>
            attendee.eventId === event.id &&
            (attendee.userId === user.id || attendee.email.toLowerCase() === user.email.toLowerCase())
        )
      )
    : undefined;
  const participantAttendee = participantEvent
    ? attendees.find(
        (attendee) =>
          attendee.eventId === participantEvent.id &&
          (attendee.userId === user?.id || attendee.email.toLowerCase() === user?.email.toLowerCase())
      )
    : undefined;
  const appHref = user ? appHomeForUser(user, events, attendees) : "/login";
  const profileHref = isAttendee
    ? participantEvent && participantAttendee
      ? `/events/${participantEvent.id}/people/${participantAttendee.id}`
      : appHref
    : "/settings/profile";

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex min-h-10 items-center gap-2 rounded-lg font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-sm text-primary-foreground">
            R
          </span>
          Relo
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link href="/about" className="hover:text-foreground">About</Link>
          {user && (
            <Link href={appHref} className="hover:text-foreground">{isAttendee ? "Event pass" : "Dashboard"}</Link>
          )}
        </nav>

        {user ? (
          <div ref={ref} className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className={cn(
                "h-10 w-10 overflow-hidden rounded-full bg-primary text-sm font-bold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                open && "ring-2 ring-primary/40"
              )}
              aria-label="Account menu"
            >
              <ProfileAvatar name={user.name} photoUrl={user.photoUrl} className="h-full w-full rounded-full bg-primary text-primary-foreground" />
            </button>

            {open && (
              <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-xl border bg-background shadow-lg">
                {/* User info */}
                <div className="border-b px-4 py-3">
                  <p className="truncate text-sm font-semibold">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  {user.company && (
                    <p className="truncate text-xs text-muted-foreground">{user.company}</p>
                  )}
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <Link
                    href={profileHref}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    {isAttendee ? "Event profile" : "Admin profile"}
                  </Link>
                  <Link
                    href={appHref}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted"
                  >
                    {isAttendee ? (
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Settings className="h-4 w-4 text-muted-foreground" />
                    )}
                    {isAttendee ? "Event pass" : "Dashboard"}
                  </Link>
                </div>

                <div className="border-t py-1">
                  <button
                    onClick={() => { logout(); router.push("/login"); setOpen(false); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted"
                  >
                    <LogOut className="h-4 w-4 text-muted-foreground" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Button asChild size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
