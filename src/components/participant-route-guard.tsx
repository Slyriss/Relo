"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useAppStore, useEvent } from "@/lib/store";

export function ParticipantRouteGuard({ eventId, children }: { eventId: string; children: ReactNode }) {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const loadingWorkspace = useAppStore((state) => state.loadingWorkspace);
  const refreshWorkspace = useAppStore((state) => state.refreshWorkspace);
  const event = useEvent(eventId);
  const resolvedEventId = event?.id ?? eventId;
  const ownAttendee = useAppStore((state) =>
    state.user?.role === "attendee"
      ? state.attendees.find(
          (attendee) =>
            attendee.eventId === resolvedEventId &&
            (attendee.userId === state.user?.id || attendee.email.toLowerCase() === state.user?.email.toLowerCase())
        )
      : undefined
  );

  useEffect(() => {
    if (!user && !loadingWorkspace) void refreshWorkspace();
  }, [loadingWorkspace, refreshWorkspace, user]);

  useEffect(() => {
    if (user?.role === "organizer" || user?.role === "admin") {
      router.replace(`/dashboard/events/${resolvedEventId}`);
    }
  }, [resolvedEventId, router, user?.role]);

  useEffect(() => {
    if (user?.role === "attendee" && !loadingWorkspace && !ownAttendee) {
      router.replace("/login");
    }
  }, [loadingWorkspace, ownAttendee, router, user?.role]);

  if (!user || loadingWorkspace || user.role !== "attendee" || !ownAttendee) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fff8e8] px-4">
        <div className="rounded-xl border bg-white px-5 py-4 text-sm text-muted-foreground shadow-sm">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-amber-600" />
            Checking event access
          </div>
          <p className="mt-1">Opening the right event space for this account.</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
