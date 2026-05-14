"use client";

import Link from "next/link";
import { use } from "react";
import { ArrowRight, CheckCircle2, Radio } from "lucide-react";
import { MatchCard } from "@/components/match-card";
import { NextBestPerson } from "@/components/next-best-person";
import { ProfileAvatar } from "@/components/profile-avatar";
import { StatCard } from "@/components/stat-card";
import { EventSwitcher } from "@/components/event-switcher";
import { Button } from "@/components/ui/button";
import { useShallow } from "zustand/react/shallow";
import { useAppStore, useCurrentEventAttendee, useEvent, useRecommendations } from "@/lib/store";
import { GOAL_COLOR } from "@/lib/graph";
import { cn } from "@/lib/utils";

export default function EventHomePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const event = useEvent(id);
  const eventId = event?.id ?? id;
  const attendees = useAppStore(useShallow((state) => state.attendees.filter((attendee) => attendee.eventId === eventId)));
  const meetings = useAppStore(useShallow((state) => state.meetings.filter((meeting) => meeting.eventId === eventId)));
  const viewer = useCurrentEventAttendee(eventId);
  const viewerId = viewer?.id;
  const allRecommendations = useRecommendations(eventId, viewerId);
  const checkIns = useAppStore(useShallow((s) => s.checkIns.filter((c) => c.eventId === eventId)));
  const recommendationActions = useAppStore(useShallow((s) => s.recommendationActions.filter((a) => a.eventId === eventId)));
  const toggleCheckIn = useAppStore((s) => s.toggleCheckIn);
  const markRecommendationAction = useAppStore((s) => s.markRecommendationAction);
  const logMeeting = useAppStore((s) => s.logMeeting);

  const iCheckedIn = checkIns.some((c) => c.attendeeId === viewerId);
  const checkedInIds = new Set(checkIns.map((c) => c.attendeeId));
  const actionByTarget = new Map(recommendationActions.map((action) => [action.targetId, action]));
  const activeRecommendations = allRecommendations.filter((recommendation) => {
    const action = actionByTarget.get(recommendation.targetId);
    return action?.action !== "skipped" && action?.action !== "met";
  });
  const nextBest =
    activeRecommendations.find((recommendation) => checkedInIds.has(recommendation.targetId)) ?? activeRecommendations[0];
  const nextBestAttendee = nextBest ? attendees.find((item) => item.id === nextBest.targetId) : undefined;
  const recommendations = activeRecommendations
    .filter((recommendation) => recommendation.targetId !== nextBest?.targetId)
    .slice(0, 2);

  // Top matches who are checked in (excluding viewer)
  const hereNow = allRecommendations
    .map((r) => attendees.find((a) => a.id === r.targetId))
    .filter((a): a is NonNullable<typeof a> => !!a && checkedInIds.has(a.id))
    .slice(0, 6);

  if (!event) return <main className="p-6">Event not found.</main>;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-6 pb-28 sm:px-6">

      <EventSwitcher currentEventId={id} />

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

      {event && viewerId && nextBest && nextBestAttendee ? (
        <NextBestPerson
          event={event}
          viewer={viewer}
          target={nextBestAttendee}
          match={nextBest}
          checkIns={checkIns}
          action={actionByTarget.get(nextBest.targetId)}
          onAction={(action, note) => markRecommendationAction({
            eventId,
            viewerId,
            targetId: nextBest.targetId,
            action,
            note,
          })}
          onMeetingSave={async (meeting) => {
            await logMeeting(meeting);
          }}
        />
      ) : null}

      <section className="rounded-2xl bg-foreground p-6 text-background sm:p-8">
        <div className="max-w-2xl">
          <div className="text-sm opacity-70">{event.venue}</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal">{event.title}</h1>
          <p className="mt-3 text-background/75">{event.description}</p>
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

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-normal">More good people to meet</h2>
        {recommendations.map((match) => {
          const attendee = attendees.find((item) => item.id === match.targetId);
          return attendee ? (
            <MatchCard
              key={match.targetId}
              attendee={attendee}
              match={match}
              source={viewer}
              viewerId={viewerId}
              eventId={eventId}
            />
          ) : null;
        })}
      </div>
    </main>
  );
}
