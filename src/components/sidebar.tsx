"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, CalendarDays, LogOut, Network, Search, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

const items = [
  { href: "/dashboard",          label: "Overview",    icon: BarChart3    },
  { href: "/dashboard/events",   label: "Events",      icon: CalendarDays },
  { href: "/dashboard/lookup",   label: "Lookup",      icon: Search       },
  { href: "/dashboard/contacts", label: "My Network",  icon: Network      },
  { href: "/dashboard/organization", label: "Organization", icon: Users },
  { href: "/settings/profile",   label: "Profile",     icon: Settings     },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const logout = useAppStore((state) => state.logout);

  const initials = user
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-muted/30 p-4 lg:flex">
      <Link href="/dashboard" className="mb-8 flex min-h-10 items-center gap-2 rounded-lg px-2 font-semibold">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-sm text-primary-foreground">
          R
        </span>
        Relo
      </Link>
      <nav className="flex-1 space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-background hover:text-foreground",
              (pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))) && "bg-background text-foreground shadow-sm"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User row */}
      <div className="mt-4 flex items-center gap-3 rounded-xl border bg-background px-3 py-2.5">
        <Link href="/settings/profile" className="flex min-w-0 flex-1 items-center gap-2.5 group">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium group-hover:text-primary transition-colors">
              {user?.name ?? "Guest"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.company ?? user?.email ?? ""}
            </p>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          title="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </aside>
  );
}
