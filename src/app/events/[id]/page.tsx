"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MatchCard } from "@/components/match-card";
import { QrBadgeCard } from "@/components/qr-badge-card";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { useShallow } from "zustand/react/shallow";
import { useAppStore, useEvent, useRecommendations } from "@/lib/store";

export default function EventHomePage({ params }: { params: { id: string } }) {
  const event = useEvent(params.id);
  const attendees = useAppStore(useShallow((state) => state.attendees.filter((attendee) => attendee.eventId === params.id)));
  const meetings = useAppStore(useShallow((state) => state.meetings.filter((meeting) => meeting.eventId === params.id)));
  const recommendations = useRecommendations(params.id).slice(0, 2);
  const allRecommendations = useRecommendations(params.id);

  if (!event) return <main className="p-6">Event not found.</main>;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-6 pb-28 sm:px-6">
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
      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-normal">Meet these people first</h2>
          {recommendations.map((match) => {
            const attendee = attendees.find((item) => item.id === match.targetId);
            return attendee ? <MatchCard key={match.targetId} attendee={attendee} match={match} /> : null;
          })}
        </div>
        {attendees[0] ? <QrBadgeCard attendee={attendees[0]} /> : null}
      </div>
    </main>
  );
}
