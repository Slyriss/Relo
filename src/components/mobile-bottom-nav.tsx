"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, QrCode, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileBottomNav({ eventId }: { eventId: string }) {
  const pathname = usePathname();
  const items = [
    { href: `/events/${eventId}`,         label: "Home",    icon: Home },
    { href: `/events/${eventId}/matches`, label: "Matches", icon: Sparkles },
    { href: `/events/${eventId}/people`,  label: "People",  icon: Users },
    { href: `/events/${eventId}/scan`,    label: "Scan",    icon: QrCode }
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-[#20160a]/95 px-2 pb-3 pt-2 text-white backdrop-blur md:hidden">
      <div className="grid grid-cols-4 gap-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-xs text-white/55",
              pathname === item.href && "bg-[#ffcc5c] text-[#20160a]"
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
