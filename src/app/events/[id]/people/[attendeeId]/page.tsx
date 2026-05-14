"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, CheckCircle2, ExternalLink, MapPin, MessageSquare, ShieldAlert, Sparkles, Target, UserCheck, UserPlus } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSharedEventHistory } from "@/lib/analytics";
import { scoreMatch } from "@/lib/ai/matching";
import { bioSimilarity } from "@/lib/ai/embeddings";
import { buildApproachBrief } from "@/lib/approach-brief";
import { formatDateRange, cn } from "@/lib/utils";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@/lib/store";

const VIEWER_ID = "att-1";

export default function AttendeeProfilePage({ params }: { params: { id: string; attendeeId: string } }) {
  const allAttendees = useAppStore(useShallow((s) => s.attendees));
  const allEvents    = useAppStore(useShallow((s) => s.events));
  const allMeetings  = useAppStore(useShallow((s) => s.meetings));
  const event = useAppStore(useShallow((s) => s.events.find((item) => item.id === params.id || item.slug === params.id)));
  const meetingRequests    = useAppStore(useShallow((s) => s.meetingRequests));
  const addMeetingRequest  = useAppStore((s) => s.addMeetingRequest);
  const removeMeetingRequest = useAppStore((s) => s.removeMeetingRequest);
  const checkIns           = useAppStore(useShallow((s) => s.checkIns));

  const existingRequest = meetingRequests.find(
    (r) => r.requesterId === VIEWER_ID && r.targetId === params.attendeeId && r.eventId === params.id
  );
  const isSelf = params.attendeeId === VIEWER_ID;
  const isRequested = !!existingRequest;
  const isHere = checkIns.some((c) => c.attendeeId === params.attendeeId && c.eventId === params.id);
  const alreadyMet = allMeetings.some(
    (meeting) =>
      meeting.eventId === params.id &&
      ((meeting.attendeeAId === VIEWER_ID && meeting.attendeeBId === params.attendeeId) ||
        (meeting.attendeeAId === params.attendeeId && meeting.attendeeBId === VIEWER_ID))
  );

  function toggleRequest() {
    if (isRequested && existingRequest) {
      removeMeetingRequest(existingRequest.id);
    } else {
      addMeetingRequest({
        id: `req-${Date.now()}`,
        eventId: params.id,
        requesterId: VIEWER_ID,
        targetId: params.attendeeId,
        createdAt: new Date().toISOString(),
        status: "pending",
      });
    }
  }

  // The viewer is always attendees[0] for the current event (Maya in demo)
  const eventAttendees = allAttendees.filter((a) => a.eventId === params.id);
  const viewer  = eventAttendees[0];
  const target  = eventAttendees.find((a) => a.id === params.attendeeId);

  const match = useMemo(
    () => (viewer && target ? scoreMatch(viewer, target, bioSimilarity(viewer.bio, target.bio)) : null),
    [viewer, target]
  );

  const approachBrief = useMemo(
    () =>
      viewer && target && event && match
        ? buildApproachBrief({ source: viewer, target, event, match, isHere })
        : null,
    [viewer, target, event, match, isHere]
  );

  const sharedHistory = useMemo(
    () =>
      viewer && target
        ? getSharedEventHistory(viewer.email, target.email, allAttendees, allEvents, allMeetings)
        : [],
    [viewer, target, allAttendees, allEvents, allMeetings]
  );

  // Exclude the current event from shared history — it's already in context
  const pastShared = sharedHistory.filter((h) => h.event.id !== params.id);

  if (!target) {
    return (
      <main className="mx-auto max-w-xl px-4 py-6">
        <p className="text-muted-foreground">Attendee not found.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 pb-28 sm:px-6">
      <Link
        href={`/events/${params.id}/people`}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to people
      </Link>

      <Card>
        <CardContent className="flex flex-col gap-5 pt-5 md:flex-row">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-muted text-2xl font-bold">
            {target.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
            {isHere && (
              <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-background" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-normal">
                  {target.name}
                  {isHere && <span className="text-xs font-normal text-emerald-600">● Here now</span>}
                </h1>
                <p className="text-sm text-muted-foreground">{target.title}, {target.company}</p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                {isSelf ? (
                  <Badge className="min-h-9 border-primary/30 text-primary">This is you</Badge>
                ) : (
                  <button
                    onClick={toggleRequest}
                    className={cn(
                      "flex min-h-10 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition",
                      isRequested
                        ? "border-primary/40 bg-primary/5 text-primary hover:bg-primary/10"
                        : "bg-background text-muted-foreground hover:bg-muted hover:text-primary"
                    )}
                  >
                    {isRequested ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                    {isRequested ? "On my list" : "Want to meet"}
                  </button>
                )}
                {alreadyMet ? (
                  <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Met
                  </Badge>
                ) : null}
                {match && !isSelf ? (
                  <Badge className="shrink-0 border-primary/30 text-primary">
                    <Sparkles className="mr-1 h-3 w-3" />
                    {match.score}
                  </Badge>
                ) : null}
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{target.bio}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {target.industry ? <Badge className="border">{target.industry}</Badge> : null}
              {target.goals.map((g) => <Badge key={g}>{g}</Badge>)}
              {target.seniority ? (
                <Badge className="border text-muted-foreground">L{target.seniority}</Badge>
              ) : null}
            </div>
            {target.linkedinUrl ? (
              <Button asChild size="sm" variant="outline" className="mt-4">
                <a href={target.linkedinUrl} target="_blank" rel="noopener noreferrer">
                  Public profile <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          {approachBrief ? (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4 text-primary" />
                  Conversation plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border bg-background p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Why now</p>
                  <p className="mt-1 text-sm">{approachBrief.whyNow}</p>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Opener
                  </p>
                  <p className="mt-1 text-sm">{approachBrief.opener}</p>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Mutual value</p>
                  <p className="mt-1 text-sm">{approachBrief.mutualValue}</p>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Avoid
                  </p>
                  <p className="mt-1 text-sm">{approachBrief.avoid}</p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {match && match.why.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Why you match
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {match.why.map((w) => (
                  <Badge key={w} className="text-xs">{w}</Badge>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Profile data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Headline</p>
                <p className="mt-1">{target.headline ?? target.bio}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Email</p>
                <p className="mt-1">{target.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Goals</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {target.goals.map((goal) => <Badge key={goal}>{goal}</Badge>)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-primary" />
                Shared event history
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pastShared.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  This is the first time you&apos;re at the same event — a fresh connection.
                </p>
              ) : (
                <ul className="space-y-3">
                  {pastShared.map(({ event, metAtEvent }) => (
                    <li key={event.id} className="flex items-start gap-3 rounded-xl border bg-muted/30 p-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background">
                        {metAtEvent
                          ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                          : <CalendarDays className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{event.title}</div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          {formatDateRange(event.startsAt, event.endsAt)}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {event.venue}
                        </div>
                        {metAtEvent ? (
                          <span className="mt-1 inline-block rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                            You met at this event
                          </span>
                        ) : (
                          <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                            Both attended — no meeting logged
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
