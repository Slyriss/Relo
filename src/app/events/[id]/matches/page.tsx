"use client";

import { useState } from "react";
import { Loader2, Radio, Sparkles, Target } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { TopRecommendedPeople } from "@/components/enrichment";
import { MatchCard } from "@/components/match-card";
import { Button } from "@/components/ui/button";
import { rankEnrichedRecommendations } from "@/lib/enrichment";
import { useAppStore, useRecommendations } from "@/lib/store";

const INITIAL_COUNT = 8;
const BATCH_SIZE = 6;

export default function MatchesPage({ params }: { params: { id: string } }) {
  const attendees = useAppStore(useShallow((state) => state.attendees.filter((attendee) => attendee.eventId === params.id)));
  const allRecs = useRecommendations(params.id);
  const checkIns = useAppStore(useShallow((state) => state.checkIns.filter((checkIn) => checkIn.eventId === params.id)));
  const source = attendees[0];
  const checkedInIds = new Set(checkIns.map((checkIn) => checkIn.attendeeId));
  const roomRecs = [...allRecs].sort((a, b) => {
    const hereDelta = Number(checkedInIds.has(b.targetId)) - Number(checkedInIds.has(a.targetId));
    return hereDelta || b.score - a.score;
  });

  const [feedback, setFeedback] = useState<Record<string, "liked" | "disliked" | undefined>>({});
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [visible, setVisible] = useState(INITIAL_COUNT);
  const [loadingMore, setLoadingMore] = useState(false);

  const shown = roomRecs.filter((r) => !dismissed.has(r.targetId)).slice(0, visible);
  const remaining = roomRecs.filter((r) => !dismissed.has(r.targetId)).length - visible;
  const topEnriched = rankEnrichedRecommendations(attendees, roomRecs, 3);

  function handleLike(targetId: string) {
    setFeedback((prev) => ({ ...prev, [targetId]: prev[targetId] === "liked" ? undefined : "liked" }));
  }

  function handleDislike(targetId: string, _reason?: string) {
    setFeedback((prev) => ({ ...prev, [targetId]: "disliked" }));
    setTimeout(() => setDismissed((prev) => new Set([...prev, targetId])), 400);
  }

  function handleDismiss(targetId: string, _reason?: string) {
    setDismissed((prev) => new Set([...prev, targetId]));
  }

  async function generateMore() {
    setLoadingMore(true);
    await new Promise((r) => setTimeout(r, 800));
    setVisible((v) => v + BATCH_SIZE);
    setLoadingMore(false);
  }

  const likedCount = Object.values(feedback).filter((v) => v === "liked").length;

  return (
    <main className="mx-auto max-w-4xl space-y-5 px-4 py-6 pb-28 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">Who to talk to next</h1>
          <p className="mt-1 text-muted-foreground">Prioritized for the room: who is here now, what angle to use, and what follow-up to earn.</p>
        </div>
        {likedCount > 0 && (
          <div className="shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
            {likedCount} liked
          </div>
        )}
      </div>
      <section className="grid gap-3 rounded-2xl border bg-muted/30 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Target className="h-4 w-4 text-primary" />
            Current networking job
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Start with checked-in people who can create one concrete outcome: investor feedback, buyer signal,
            partnership test, or a useful operator intro.
          </p>
        </div>
        <div className="flex min-h-10 items-center gap-2 rounded-xl bg-background px-3 text-sm font-medium">
          <Radio className="h-4 w-4 text-primary" />
          {checkedInIds.size} here now
        </div>
      </section>
      <TopRecommendedPeople
        recommendations={topEnriched}
        title="Top 3 to prioritize now"
        description="Ranked first by live presence, then by event intent, public profile confidence, and mutual value."
        getHref={(recommendation) => `/events/${params.id}/people/${recommendation.attendee.id}`}
      />
      <div className="grid gap-3">
        {shown.map((match) => {
          const attendee = attendees.find((item) => item.id === match.targetId);
          return attendee ? (
            <MatchCard
              key={match.targetId}
              attendee={attendee}
              match={match}
              source={source}
              eventId={params.id}
              feedback={feedback[match.targetId] ?? null}
              onLike={() => handleLike(match.targetId)}
              onDislike={(r) => handleDislike(match.targetId, r)}
              onDismiss={(r) => handleDismiss(match.targetId, r)}
            />
          ) : null;
        })}
      </div>

      {remaining > 0 ? (
        <div className="flex flex-col items-center gap-2 pt-2">
          <p className="text-sm text-muted-foreground">{remaining} more matches available</p>
          <Button variant="outline" onClick={generateMore} disabled={loadingMore} className="gap-2">
            {loadingMore ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Finding more…</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Generate more</>
            )}
          </Button>
        </div>
      ) : shown.length > 0 ? (
        <p className="text-center text-sm text-muted-foreground pt-2">You&apos;ve seen all {allRecs.length} recommendations.</p>
      ) : (
        <p className="text-center text-sm text-muted-foreground pt-2">No more recommendations. Check back after more attendees join.</p>
      )}
    </main>
  );
}
