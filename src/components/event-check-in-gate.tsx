"use client";

import Link from "next/link";
import { CheckCircle2, LockKeyhole, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "@/components/profile-avatar";
import { useAppStore, useCurrentEventAttendee, useEvent } from "@/lib/store";
import { cn, sanitizeDisplayText } from "@/lib/utils";

export function EventCheckInGate({ eventId, children }: { eventId: string; children: React.ReactNode }) {
  const event = useEvent(eventId);
  const resolvedEventId = event?.id ?? eventId;
  const attendee = useCurrentEventAttendee(resolvedEventId);
  const checkIns = useAppStore((state) => state.checkIns);
  const toggleCheckIn = useAppStore((state) => state.toggleCheckIn);
  const checkedIn = attendee
    ? checkIns.some((checkIn) => checkIn.eventId === resolvedEventId && checkIn.attendeeId === attendee.id)
    : false;

  if (checkedIn) return <>{children}</>;

  return (
    <main className="min-h-screen bg-[#fff8e8] px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-xl flex-col gap-5">
        <Link href="/events" className="flex min-h-10 w-fit items-center gap-3 rounded-lg text-sm font-semibold">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ffcc5c] text-xs font-black text-[#20160a] shadow-sm">
            R
          </span>
          <span>
            <span className="block leading-tight text-[#20160a]">Relo Pass</span>
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Check-in required</span>
          </span>
        </Link>

        <section className="overflow-hidden rounded-2xl border bg-background shadow-sm">
          <div
            className="min-h-48 bg-cover bg-center p-6 text-white"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(24,20,15,.92), rgba(24,20,15,.55)), url('/relo-assets/event-hero-default.png')",
            }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm text-white/85">
              <LockKeyhole className="h-4 w-4 text-[#ffcc5c]" />
              Event mode unlocks after check-in
            </div>
            <h1 className="mt-5 max-w-md text-3xl font-semibold tracking-normal">Check in to open your event space</h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/72">
              Matches, attendees, event details, QR tools, and meeting capture stay hidden until you confirm you are here.
            </p>
          </div>

          <div className="space-y-5 p-5">
            {attendee ? (
              <div className="flex items-center gap-3 rounded-xl border bg-muted/25 p-4">
                <ProfileAvatar name={attendee.name} photoUrl={attendee.photoUrl} className="h-12 w-12" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{attendee.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{attendee.title}, {attendee.company}</p>
                </div>
              </div>
            ) : null}

            <div className="grid gap-3 rounded-xl border bg-muted/25 p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Radio className="h-4 w-4 text-primary" />
                What unlocks after check-in
              </div>
              <p>Event information, ranked matches, attendee directory, QR badge, and meeting logging.</p>
            </div>

            <Button
              type="button"
              size="lg"
              disabled={!attendee}
              onClick={() => attendee && toggleCheckIn(resolvedEventId, attendee.id)}
              className={cn("w-full", !attendee && "opacity-60")}
            >
              <CheckCircle2 className="h-4 w-4" />
              Check in
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              {event ? `You are checking in to ${sanitizeDisplayText(event.title, "this event")}.` : "Opening event access."}
            </p>
            <Link href="/events" className="block text-center text-sm font-medium text-primary hover:underline">
              Back to my events
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
