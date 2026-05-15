"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, CalendarDays, LogOut, Network, Search, Settings, ShieldCheck, Users } from "lucide-react";
import { ProfileAvatar } from "@/components/profile-avatar";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

const items = [
  { href: "/dashboard",          label: "Ops overview", icon: BarChart3    },
  { href: "/dashboard/events",   label: "Event control", icon: CalendarDays },
  { href: "/dashboard/lookup",   label: "Research desk", icon: Search       },
  { href: "/dashboard/contacts", label: "CRM network",  icon: Network      },
  { href: "/dashboard/organization", label: "Org admin", icon: Users },
  { href: "/settings/profile",   label: "Admin profile", icon: Settings     },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const logout = useAppStore((state) => state.logout);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 self-start flex-col bg-[#101319] p-4 text-white lg:flex">
      <Link href="/dashboard" className="mb-5 flex min-h-10 items-center gap-3 rounded-lg px-2 font-semibold">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400 text-sm font-bold text-[#101215]">
          R
        </span>
        <span>
          <span className="block leading-tight">Relo Admin</span>
          <span className="block text-[11px] font-medium uppercase tracking-wide text-white/45">Admin Control</span>
        </span>
      </Link>
      <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-200">
          <ShieldCheck className="h-3.5 w-3.5" />
          Admin workspace
        </div>
        <p className="mt-2 text-xs leading-5 text-white/55">
          Build events, import attendees, watch engagement, and intervene where the room needs help.
        </p>
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pb-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/58 transition hover:bg-white/10 hover:text-white",
              (pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))) && "bg-white text-[#16181d] shadow-sm"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User row */}
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5">
        <Link href="/settings/profile" className="flex min-w-0 flex-1 items-center gap-2.5 group">
          <ProfileAvatar name={user?.name ?? "Guest"} photoUrl={user?.photoUrl} className="h-8 w-8 rounded-full bg-emerald-400 text-xs text-[#101215]" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white transition-colors group-hover:text-emerald-200">
              {user?.name ?? "Guest"}
            </p>
            <p className="truncate text-xs text-white/45">
              {user?.company ?? user?.email ?? ""}
            </p>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/45 transition hover:bg-white/10 hover:text-white"
          title="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </aside>
  );
}
