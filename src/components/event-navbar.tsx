"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Eye, EyeOff, LogOut, Settings, User } from "lucide-react";
import { ProfileAvatar } from "@/components/profile-avatar";
import { useAppStore, useCurrentEventAttendee, useEvent } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ProfileVisibility } from "@/types";

const VISIBILITY_QUICK: { key: keyof ProfileVisibility; label: string }[] = [
  { key: "company",    label: "Company"  },
  { key: "title",      label: "Title"    },
  { key: "bio",        label: "Bio"      },
  { key: "email",      label: "Email"    },
  { key: "linkedinUrl",label: "LinkedIn" },
  { key: "location",   label: "Location" },
];

export function EventNavbar({ eventId }: { eventId: string }) {
  const event       = useEvent(eventId);
  const resolvedEventId = event?.id ?? eventId;
  const user        = useAppStore((s) => s.user);
  const ownAttendee = useCurrentEventAttendee(resolvedEventId);
  const logout      = useAppStore((s) => s.logout);
  const setVisibility = useAppStore((s) => s.setVisibility);
  const router      = useRouter();

  const [open, setOpen]           = useState(false);
  const [tab, setTab]             = useState<"profile" | "display">("profile");
  const ref = useRef<HTMLDivElement>(null);
  const eventProfileHref = ownAttendee ? `/events/${resolvedEventId}/people/${ownAttendee.id}` : `/events/${resolvedEventId}`;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href={`/events/${resolvedEventId}`} className="flex min-h-10 items-center gap-3 rounded-lg text-sm font-semibold">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ffcc5c] text-xs font-black text-[#20160a] shadow-sm">
            R
          </span>
          <span>
            <span className="block leading-tight text-[#20160a]">Relo Pass</span>
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Attendee mode</span>
          </span>
        </Link>

        {user ? (
          <div ref={ref} className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className={cn(
                "h-11 w-11 overflow-hidden rounded-full bg-primary text-xs font-bold text-primary-foreground ring-offset-background transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                open && "ring-2 ring-primary/40"
              )}
              aria-label="Profile menu"
            >
              <ProfileAvatar name={user.name} photoUrl={user.photoUrl} className="h-full w-full rounded-full bg-primary text-primary-foreground" />
            </button>

            {open && (
              <div className="absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-2xl border bg-background shadow-lg">

                {/* User summary */}
                <div className="flex items-center gap-3 border-b px-4 py-3">
                  <ProfileAvatar name={user.name} photoUrl={user.photoUrl} className="h-9 w-9 rounded-full bg-primary text-sm text-primary-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.title && user.company ? `${user.title} · ${user.company}` : user.email}
                    </p>
                  </div>
                </div>

                {/* Tab switcher */}
                <div className="flex border-b">
                  {(["profile", "display"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={cn(
                        "flex-1 py-2 text-xs font-medium capitalize transition",
                        tab === t
                          ? "border-b-2 border-primary text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t === "profile" ? "Profile" : "Display"}
                    </button>
                  ))}
                </div>

                {/* Profile tab */}
                {tab === "profile" && (
                  <div className="py-1">
                    <Link
                      href={eventProfileHref}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted"
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      Event profile
                    </Link>
                    <Link
                      href="/setup"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted"
                    >
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      Account setup
                    </Link>
                    <div className="border-t mt-1 pt-1">
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

                {/* Display tab — quick visibility toggles */}
                {tab === "display" && (
                  <div className="px-4 py-3 space-y-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Visible to other attendees
                    </p>
                    {VISIBILITY_QUICK.map(({ key, label }) => {
                      const on = user.visibility[key];
                      return (
                        <button
                          key={key}
                          onClick={() => setVisibility(key, !on)}
                          className="flex w-full items-center justify-between rounded-lg px-1 py-1.5 text-sm transition hover:bg-muted"
                        >
                          <span className={cn(on ? "text-foreground" : "text-muted-foreground")}>
                            {label}
                          </span>
                          <span
                            className={cn(
                              "flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
                              on
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {on ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                            {on ? "On" : "Off"}
                          </span>
                        </button>
                      );
                    })}
                    <Link
                      href={eventProfileHref}
                      onClick={() => setOpen(false)}
                      className="mt-1 block text-center text-xs text-primary hover:underline"
                    >
                      Full attendee display →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="text-sm font-medium text-primary hover:underline">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
