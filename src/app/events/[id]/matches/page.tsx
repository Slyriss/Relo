"use client";

import { useShallow } from "zustand/react/shallow";
import { MatchCard } from "@/components/match-card";
import { useAppStore, useRecommendations } from "@/lib/store";

export default function MatchesPage({ params }: { params: { id: string } }) {
  const attendees = useAppStore(useShallow((state) => state.attendees.filter((attendee) => attendee.eventId === params.id)));
  const recommendations = useRecommendations(params.id).slice(0, 12);

  return (
    <main className="mx-auto max-w-4xl space-y-5 px-4 py-6 pb-28 sm:px-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Recommended people</h1>
        <p className="mt-1 text-muted-foreground">Ranked by goals, industry context, role fit, and diversity.</p>
      </div>
      <div className="grid gap-3">
        {recommendations.map((match) => {
          const attendee = attendees.find((item) => item.id === match.targetId);
          return attendee ? <MatchCard key={match.targetId} attendee={attendee} match={match} /> : null;
        })}
      </div>
    </main>
  );
}
