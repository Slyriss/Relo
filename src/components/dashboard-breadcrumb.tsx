"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LayoutDashboard } from "lucide-react";
import { useAppStore } from "@/lib/store";

type Crumb = { label: string; href?: string };

function useCrumbs(): Crumb[] {
  const pathname = usePathname();
  const events = useAppStore((s) => s.events);

  const segments = pathname.replace(/\/$/, "").split("/").filter(Boolean);

  // /dashboard or /dashboard/events (root)
  if (pathname === "/dashboard" || pathname === "/dashboard/events") {
    return [{ label: "Events" }];
  }

  // /dashboard/events/new
  if (pathname === "/dashboard/events/new") {
    return [
      { label: "Events", href: "/dashboard/events" },
      { label: "New event" },
    ];
  }

  // /dashboard/events/[id]
  if (segments[0] === "dashboard" && segments[1] === "events" && segments[2] && segments[2] !== "new") {
    const event = events.find((e) => e.id === segments[2]);
    return [
      { label: "Events", href: "/dashboard/events" },
      { label: event?.title ?? "Event" },
    ];
  }

  // /dashboard/contacts
  if (pathname === "/dashboard/contacts") {
    return [{ label: "My Network" }];
  }

  // /dashboard/organization
  if (pathname === "/dashboard/organization") {
    return [{ label: "Organization" }];
  }

  // /settings/profile or /settings/...
  if (segments[0] === "settings") {
    const labels: Record<string, string> = {
      profile: "Profile",
      account: "Account",
      notifications: "Notifications",
    };
    const sub = segments[1];
    if (!sub) return [{ label: "Settings" }];
    return [
      { label: "Settings", href: `/settings/${sub}` },
      { label: labels[sub] ?? (sub.charAt(0).toUpperCase() + sub.slice(1)) },
    ];
  }

  // Fallback
  return segments.slice(1).map((seg, i, arr) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
    href: i < arr.length - 1 ? "/" + segments.slice(0, i + 2).join("/") : undefined,
  }));
}

export function DashboardBreadcrumb() {
  const crumbs = useCrumbs();

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      <Link
        href="/dashboard/events"
        className="flex min-h-10 min-w-10 items-center gap-1.5 rounded-lg px-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <LayoutDashboard className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Dashboard</span>
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
          {crumb.href && i < crumbs.length - 1 ? (
            <Link
              href={crumb.href}
              className="inline-flex min-h-10 items-center rounded-lg px-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
