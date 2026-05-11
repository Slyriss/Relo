"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, QrCode, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileBottomNav({ eventId }: { eventId: string }) {
  const pathname = usePathname();
  const items = [
    { href: `/events/${eventId}`, label: "Home", icon: CalendarDays },
    { href: `/events/${eventId}/people`, label: "People", icon: Users },
    { href: `/events/${eventId}/matches`, label: "Matches", icon: Sparkles },
    { href: `/events/${eventId}/scan`, label: "Scan", icon: QrCode }
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-2 pb-3 pt-2 backdrop-blur md:hidden">
      <div className="grid grid-cols-4 gap-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs text-muted-foreground",
              pathname === item.href && "bg-muted text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
