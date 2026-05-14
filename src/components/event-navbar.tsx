"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Eye, EyeOff, LogOut, Settings, User } from "lucide-react";
import { useAppStore } from "@/lib/store";
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
  const user        = useAppStore((s) => s.user);
  const logout      = useAppStore((s) => s.logout);
  const setVisibility = useAppStore((s) => s.setVisibility);
  const router      = useRouter();

  const [open, setOpen]           = useState(false);
  const [tab, setTab]             = useState<"profile" | "display">("profile");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = user
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex min-h-10 items-center gap-2 rounded-lg text-sm font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
            R
          </span>
          Relo
        </Link>

        {user ? (
          <div ref={ref} className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground ring-offset-background transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                open && "ring-2 ring-primary/40"
              )}
              aria-label="Profile menu"
            >
              {initials}
            </button>

            {open && (
              <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-xl border bg-background shadow-lg">

                {/* User summary */}
                <div className="flex items-center gap-3 border-b px-4 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {initials}
                  </div>
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
                      href="/settings/profile"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted"
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      Edit profile
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
                      href="/settings/profile"
                      onClick={() => setOpen(false)}
                      className="mt-1 block text-center text-xs text-primary hover:underline"
                    >
                      Full profile settings →
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
