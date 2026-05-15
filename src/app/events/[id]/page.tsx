"use client";

import Link from "next/link";
import { use } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, Clock, MessageSquare, Radio } from "lucide-react";
import { ProfileAvatar } from "@/components/profile-avatar";
import { StatCard } from "@/components/stat-card";
import { EventSwitcher } from "@/components/event-switcher";
import { Button } from "@/components/ui/button";
import { useShallow } from "zustand/react/shallow";
import { useAppStore, useCurrentEventAttendee, useEvent, useRecommendations } from "@/lib/store";
import { GOAL_COLOR } from "@/lib/graph";
import { cn, sanitizeDisplayText } from "@/lib/utils";

export default function EventHomePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const event = useEvent(id);
  const eventId = event?.id ?? id;
  const events = useAppStore(useShallow((state) => state.events));
  const attendees = useAppStore(useShallow((state) => state.attendees.filter((attendee) => attendee.eventId === eventId)));
  const meetings = useAppStore(useShallow((state) => state.meetings.filter((meeting) => meeting.eventId === eventId)));
  const allEvents = useAppStore(useShallow((state) => state.events));
  const allMeetingRequests = useAppStore(useShallow((state) => state.meetingRequests));
  const viewer = useCurrentEventAttendee(eventId);
  const viewerId = viewer?.id;
  const allRecommendations = useRecommendations(eventId, viewerId);
  const checkIns = useAppStore(useShallow((s) => s.checkIns.filter((c) => c.eventId === eventId)));
  const toggleCheckIn = useAppStore((s) => s.toggleCheckIn);

  const iCheckedIn = checkIns.some((c) => c.attendeeId === viewerId);
  const checkedInIds = new Set(checkIns.map((c) => c.attendeeId));

  // Top matches who are checked in (excluding viewer)
  const hereNow = allRecommendations
    .map((r) => attendees.find((a) => a.id === r.targetId))
    .filter((a): a is NonNullable<typeof a> => !!a && checkedInIds.has(a.id))
    .slice(0, 6);
  const topMatch = allRecommendations[0]
    ? attendees.find((attendee) => attendee.id === allRecommendations[0].targetId)
    : undefined;
  const upcomingEvents = allEvents
    .filter((item) => new Date(item.endsAt).getTime() >= Date.now())
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const myRequests = viewerId
    ? allMeetingRequests.filter((request) => request.requesterId === viewerId || request.targetId === viewerId)
    : [];
  const pendingRequests = myRequests.filter((request) => request.status === "pending");

  if (!event) return <main className="p-6">Event not found.</main>;

  const eventTitle = sanitizeDisplayText(event.title, "Event title needs review");
  const eventDescription = sanitizeDisplayText(event.description, "Description needs review");
  const eventVenue = sanitizeDisplayText(event.venue, "Venue needs review");

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-6 pb-28 sm:px-6">

      {events.length > 1 ? <EventSwitcher currentEventId={id} /> : null}

      {/* Check-in bar */}
      <div className="flex items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <Radio className="h-4 w-4 text-primary" />
          <span className="font-medium">{checkedInIds.size} people here now</span>
          {iCheckedIn && <span className="text-xs text-emerald-600 font-medium">· You&apos;re checked in</span>}
        </div>
        <button
          onClick={() => viewerId && toggleCheckIn(eventId, viewerId)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
            "min-h-10",
            iCheckedIn
              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {iCheckedIn ? <><CheckCircle2 className="h-3.5 w-3.5" /> Checked in</> : "Check in"}
        </button>
      </div>

      <section
        className="overflow-hidden rounded-2xl bg-cover bg-center p-6 text-background sm:p-8"
        style={{
          backgroundImage: "linear-gradient(90deg, rgba(24,20,15,.92), rgba(24,20,15,.62)), url('/relo-assets/event-hero-default.png')",
        }}
      >
        <div className="max-w-2xl">
          <div className="break-words text-sm opacity-70">{eventVenue}</div>
          <h1 className="mt-3 break-words text-4xl font-semibold tracking-normal">{eventTitle}</h1>
          <p className="mt-3 break-words text-background/75">{eventDescription}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={`/events/${event.id}/matches`}>
                See matches <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={`/events/${event.id}/scan`}>Scan QR</Link>
            </Button>
          </div>
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="People attending" value={attendees.length} />
        <StatCard label="Recommended intros" value={allRecommendations.length} />
        <StatCard label="Your meetings" value={meetings.length} />
      </div>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-2xl border bg-background p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <CalendarDays className="h-5 w-5 text-primary" />
                Your events
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">Upcoming event spaces linked to this account.</p>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {upcomingEvents.length} upcoming
            </span>
          </div>
          <div className="mt-4 grid gap-3">
            {upcomingEvents.map((item) => {
              const active = item.id === event.id;
              return (
                <Link
                  key={item.id}
                  href={`/events/${item.id}`}
                  className={cn(
                    "rounded-xl border p-4 transition hover:border-primary/40 hover:bg-muted/30",
                    active && "border-primary/35 bg-primary/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold">{sanitizeDisplayText(item.title, "Event title needs review")}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{sanitizeDisplayText(item.venue, "Venue needs review")}</p>
                    </div>
                    {active ? <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">Current</span> : null}
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(item.startsAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border bg-background p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <MessageSquare className="h-5 w-5 text-primary" />
            Meetings and intent
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">A quick summary of your meeting activity across this event.</p>
          <div className="mt-4 grid gap-3">
            <div className="rounded-xl border bg-muted/25 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Logged meetings</p>
              <p className="mt-2 text-3xl font-semibold">{meetings.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">Use Scan after a real conversation to add notes.</p>
            </div>
            <div className="rounded-xl border bg-muted/25 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Pending intro intent</p>
              <p className="mt-2 text-3xl font-semibold">{pendingRequests.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {topMatch ? `Next recommendation: ${topMatch.name}.` : "Open Matches when you want a ranked next step."}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/events/${eventId}/matches`}>Review matches</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/events/${eventId}/scan`}>Log meeting</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Here now */}
      {hereNow.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            Your matches here now
          </h2>
          <p className="text-sm text-muted-foreground">Live room signal only. Open Matches when you want recommendations and prep.</p>
          <div className="flex flex-wrap gap-2">
            {hereNow.map((a) => (
            <Link
                key={a.id}
              href={`/events/${eventId}/people/${a.id}`}
                className="flex min-h-10 items-center gap-2 rounded-xl border bg-background px-3 py-2 transition hover:border-primary/40"
              >
                <ProfileAvatar
                  name={a.name}
                  photoUrl={a.photoUrl}
                  className="h-7 w-7 rounded-full text-[11px] text-white"
                  style={{ background: GOAL_COLOR[a.goals[0]] ?? "#94a3b8" }}
                />
                <div>
                  <p className="text-xs font-semibold leading-tight">{a.name.split(" ")[0]}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{a.company.split(" ")[0]}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
