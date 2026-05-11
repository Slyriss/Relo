"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Overview", icon: BarChart3 },
  { href: "/dashboard/events", label: "Events", icon: CalendarDays },
  { href: "/org/northstar", label: "Organization", icon: Users },
  { href: "/settings/profile", label: "Profile", icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-muted/30 p-4 lg:block">
      <Link href="/dashboard" className="mb-8 flex items-center gap-2 px-2 font-semibold">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-sm text-primary-foreground">
          R
        </span>
        Relo
      </Link>
      <nav className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-background hover:text-foreground",
              pathname === item.href && "bg-background text-foreground shadow-sm"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
