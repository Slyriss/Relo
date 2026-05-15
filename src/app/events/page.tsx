"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock, History, Radio, ShieldCheck } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Navbar } from "@/components/navbar";
import { ProfileAvatar } from "@/components/profile-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { appHomeForUser } from "@/lib/navigation";
import { useAppStore } from "@/lib/store";
import { cn, formatDateRange, sanitizeDisplayText } from "@/lib/utils";

export default function MyEventsPage() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const loadingWorkspace = useAppStore((state) => state.loadingWorkspace);
  const refreshWorkspace = useAppStore((state) => state.refreshWorkspace);
  const events = useAppStore(useShallow((state) => state.events));
  const attendees = useAppStore(useShallow((state) => state.attendees));
  const meetings = useAppStore(useShallow((state) => state.meetings));
  const checkIns = useAppStore(useShallow((state) => state.checkIns));

  useEffect(() => {
    if (!user && !loadingWorkspace) void refreshWorkspace();
  }, [loadingWorkspace, refreshWorkspace, user]);

  useEffect(() => {
    if (user?.role === "admin" || user?.role === "organizer") router.replace(appHomeForUser(user, events, attendees));
  }, [attendees, events, router, user]);

  if (!user || loadingWorkspace || user.role !== "attendee") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fff8e8] px-4">
        <div className="rounded-xl border bg-white px-5 py-4 text-sm text-muted-foreground shadow-sm">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-amber-600" />
            Opening your Relo events
          </div>
          <p className="mt-1">Checking the event spaces linked to this account.</p>
        </div>
      </main>
    );
  }

  const ownedAttendees = attendees.filter(
    (attendee) => attendee.userId === user.id || attendee.email.toLowerCase() === user.email.toLowerCase()
  );
  const ownedEventIds = new Set(ownedAttendees.map((attendee) => attendee.eventId));
  const visibleEvents = events
    .filter((event) => ownedEventIds.has(event.id))
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const now = Date.now();
  const upcoming = visibleEvents.filter((event) => new Date(event.endsAt).getTime() >= now);
  const past = visibleEvents.filter((event) => new Date(event.endsAt).getTime() < now).reverse();

  function eventCard(event: (typeof visibleEvents)[number], mode: "upcoming" | "past") {
    const attendee = ownedAttendees.find((item) => item.eventId === event.id);
    const checkedIn = attendee ? checkIns.some((checkIn) => checkIn.eventId === event.id && checkIn.attendeeId === attendee.id) : false;
    const meetingCount = attendee
      ? meetings.filter(
          (meeting) =>
            meeting.eventId === event.id &&
            (meeting.attendeeAId === attendee.id || meeting.attendeeBId === attendee.id)
        ).length
      : 0;

    return (
      <Card key={event.id} className={cn("overflow-hidden", mode === "past" && "opacity-85")}>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="break-words text-lg font-semibold">{sanitizeDisplayText(event.title, "Event title needs review")}</h2>
              <Badge className={checkedIn ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}>
                {mode === "past" ? "Past" : checkedIn ? "Checked in" : "Not checked in"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{sanitizeDisplayText(event.venue, "Venue needs review")}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDateRange(event.startsAt, event.endsAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5" />
                {meetingCount} logged meetings
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button asChild>
              <Link href={`/events/${event.id}`}>{checkedIn ? "Open event" : "Check in"}</Link>
            </Button>
            {mode === "past" ? (
              <Button asChild variant="outline">
                <Link href={`/events/${event.id}/recap`}>View recap</Link>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff8e8]">
      <Navbar />
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 pb-24 sm:px-6">
        <section className="rounded-2xl border bg-background p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                <History className="h-4 w-4" />
                Normal mode
              </p>
              <h1 className="text-3xl font-semibold tracking-normal">My events</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Review upcoming and past events without entering event mode. Event details, matches, attendees, and scan tools open after check-in.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-muted/25 p-3">
              <ProfileAvatar name={user.name} photoUrl={user.photoUrl} className="h-10 w-10" />
              <div>
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-muted-foreground">{visibleEvents.length} linked events</p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Clock className="h-5 w-5 text-primary" />
              Upcoming
            </h2>
            <span className="text-sm text-muted-foreground">{upcoming.length}</span>
          </div>
          {upcoming.length ? (
            <div className="grid gap-3">{upcoming.map((event) => eventCard(event, "upcoming"))}</div>
          ) : (
            <div className="rounded-xl border border-dashed bg-background p-6 text-sm text-muted-foreground">
              No upcoming events are linked to this account yet.
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Past events
            </h2>
            <span className="text-sm text-muted-foreground">{past.length}</span>
          </div>
          {past.length ? (
            <div className="grid gap-3">{past.map((event) => eventCard(event, "past"))}</div>
          ) : (
            <div className="rounded-xl border border-dashed bg-background p-6 text-sm text-muted-foreground">
              Past events will appear here after they end.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
