"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { appHomeForUser } from "@/lib/navigation";

export function AdminRouteGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const events = useAppStore((state) => state.events);
  const attendees = useAppStore((state) => state.attendees);
  const loadingWorkspace = useAppStore((state) => state.loadingWorkspace);
  const refreshWorkspace = useAppStore((state) => state.refreshWorkspace);

  useEffect(() => {
    if (!user && !loadingWorkspace) void refreshWorkspace();
  }, [loadingWorkspace, refreshWorkspace, user]);

  useEffect(() => {
    if (user?.role === "attendee") router.replace(appHomeForUser(user, events, attendees));
  }, [attendees, events, router, user]);

  if (!user || loadingWorkspace || user.role === "attendee") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f5f7] px-4">
        <div className="rounded-xl border bg-white px-5 py-4 text-sm text-muted-foreground shadow-sm">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Checking workspace access
          </div>
          <p className="mt-1">Opening the right workspace for this account.</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
