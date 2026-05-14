"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Clock, MessageSquare, UserCheck, UserPlus, X } from "lucide-react";
import { MeetingCaptureForm } from "@/components/meeting-capture-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildApproachBrief } from "@/lib/approach-brief";
import { initials } from "@/lib/utils";
import type { Attendee, CheckIn, Event, MatchRecommendation, Meeting, RecommendationAction } from "@/types";

export function NextBestPerson({
  event,
  viewer,
  target,
  match,
  checkIns,
  action,
  onAction,
  onMeetingSave,
}: {
  event: Event;
  viewer: Attendee;
  target: Attendee;
  match: MatchRecommendation;
  checkIns: CheckIn[];
  action?: RecommendationAction;
  onAction: (action: RecommendationAction["action"], note?: string) => void;
  onMeetingSave: (meeting: Meeting) => void | Promise<void>;
}) {
  const [captureOpen, setCaptureOpen] = useState(false);
  const isHere = checkIns.some((checkIn) => checkIn.attendeeId === target.id);
  const brief = buildApproachBrief({ source: viewer, target, event, match, isHere });
  const isDone = action?.action === "met";

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge className="mb-2 bg-background">
              {brief.decision === "meet_now" ? "Next best person now" : "Best person to save"}
            </Badge>
            <CardTitle className="text-xl">Talk to {target.name}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {target.title}, {target.company}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isHere ? (
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Here now</Badge>
            ) : (
              <Badge>Not checked in</Badge>
            )}
            <Badge className="border-primary/30 text-primary">{match.score}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background font-semibold">
            {initials(target.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">{brief.whyNow}</p>
            <p className="mt-1 text-sm text-muted-foreground">{brief.mutualValue}</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border bg-background p-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" />
              Opener
            </p>
            <p className="mt-2 text-sm">{brief.opener}</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Avoid
            </p>
            <p className="mt-2 text-sm">{brief.avoid}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onAction("saved", "Saved from next-best-person recommendation.")}>
            <UserPlus className="h-4 w-4" />
            Save
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setCaptureOpen((current) => !current)}
            disabled={isDone}
          >
            {isDone ? <CheckCircle2 className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
            {isDone ? "Marked met" : captureOpen ? "Close capture" : "I met them"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => onAction("skipped", brief.avoid)}>
            <X className="h-4 w-4" />
            Skip
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link href={`/events/${event.id}/people/${target.id}`}>View profile</Link>
          </Button>
        </div>
        {captureOpen ? (
          <MeetingCaptureForm
            compact
            eventId={event.id}
            current={viewer}
            target={target}
            initialNote={`Follow up on: ${brief.opener}`}
            onSave={async (meeting) => {
              await onMeetingSave(meeting);
              onAction("met", meeting.note);
              setCaptureOpen(false);
            }}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
