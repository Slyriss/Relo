"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, Radio, UsersRound } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrganizerIntroRecommendations, getUnmatchedAttendees } from "@/lib/analytics";
import { useAppStore } from "@/lib/store";
import { sanitizeDisplayText } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type EventHealthMetric = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  detail: string;
};

export default function DashboardPage() {
  const organization = useAppStore((state) => state.organization);
  const events = useAppStore(useShallow((state) => state.events));
  const attendees = useAppStore(useShallow((state) => state.attendees));
  const meetings = useAppStore(useShallow((state) => state.meetings));
  const checkIns = useAppStore(useShallow((state) => state.checkIns));
  const meetingRequests = useAppStore(useShallow((state) => state.meetingRequests));

  const now = Date.now();
  const upcomingEvents = events
    .filter((event) => new Date(event.endsAt).getTime() >= now)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const activeEvent = upcomingEvents[0] ?? events[0];
  const activeEventAttendees = activeEvent ? attendees.filter((attendee) => attendee.eventId === activeEvent.id) : [];
  const activeEventMeetings = activeEvent ? meetings.filter((meeting) => meeting.eventId === activeEvent.id) : [];
  const activeEventCheckIns = activeEvent ? checkIns.filter((checkIn) => checkIn.eventId === activeEvent.id) : [];
  const unmatched = getUnmatchedAttendees(activeEventAttendees, activeEventMeetings);
  const introOpportunities = getOrganizerIntroRecommendations(activeEventAttendees, 3);
  const pendingRequests = meetingRequests.filter((request) => request.status === "pending");
  const activeEventTitle = activeEvent ? sanitizeDisplayText(activeEvent.title, "Event title needs review") : "";
  const activeEventVenue = activeEvent ? sanitizeDisplayText(activeEvent.venue, "Venue needs review") : "";
  const completionRate = Math.round(
    (activeEventAttendees.filter((attendee) => attendee.profileComplete).length / Math.max(activeEventAttendees.length, 1)) * 100
  );

  return (
    <div className="space-y-8">
      <section
        className="overflow-hidden rounded-lg border bg-cover bg-center p-6 text-white shadow-sm sm:p-8"
        style={{ backgroundImage: "linear-gradient(90deg, rgba(7,17,31,.92), rgba(7,17,31,.58)), url('/relo-assets/dashboard-ambient-topo.png')" }}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge className="border-white/20 bg-white/10 text-white">Admin workspace</Badge>
            <h1 className="mt-4 text-3xl font-semibold tracking-normal sm:text-4xl">
              {organization?.name ?? "Workspace"} operations overview
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72">
              Monitor the live event pipeline, attendee readiness, intro requests, and follow-up volume from one admin control room.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-emerald-300 text-[#07111f] hover:bg-emerald-200">
              <Link href="/dashboard/events/new">
                New event <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white/25 bg-white/10 text-white hover:bg-white/15">
              <Link href="/dashboard/lookup">Research desk</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Events managed" value={events.length} />
        <StatCard label="Upcoming" value={upcomingEvents.length} />
        <StatCard label="Attendee records" value={attendees.length} />
        <StatCard label="Live check-ins" value={checkIns.length} />
        <StatCard label="Pending intros" value={pendingRequests.length} />
      </div>

      {activeEvent ? (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>{activeEventTitle}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{activeEventVenue}</p>
              </div>
              <Button asChild size="sm">
                <Link href={`/dashboard/events/${activeEvent.id}`}>Manage event</Link>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {([
                { icon: UsersRound, label: "Profiles complete", value: `${completionRate}%`, detail: `${activeEventAttendees.length} invited` },
                { icon: Radio, label: "Here now", value: activeEventCheckIns.length, detail: "checked in" },
                { icon: CheckCircle2, label: "Meetings logged", value: activeEventMeetings.length, detail: "from participant notes" },
                { icon: CalendarDays, label: "Unmatched attendees", value: unmatched.length, detail: "need admin attention" },
              ] satisfies EventHealthMetric[]).map(({ icon: Icon, label, value, detail }) => {
                return (
                  <div key={String(label)} className="rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon className="h-4 w-4 text-primary" />
                      {label}
                    </div>
                    <p className="mt-3 text-3xl font-semibold">{value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Intro queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {introOpportunities.length ? (
                introOpportunities.map((intro) => (
                  <div key={`${intro.source.id}-${intro.target.id}`} className="rounded-lg border bg-background p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold">
                        {intro.source.name} to {intro.target.name}
                      </p>
                      <Badge className="shrink-0">{intro.score}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{intro.why[0]}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                  Import attendees to surface the next organizer-facilitated introductions.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="grid gap-5 p-6 sm:grid-cols-[180px_1fr] sm:items-center">
            <div
              aria-hidden="true"
              className="h-36 w-full rounded-lg bg-cover bg-center"
              style={{ backgroundImage: "url('/relo-assets/empty-state-constellation.png')" }}
            />
            <div>
              <h2 className="text-xl font-semibold">Create your first event</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                The admin overview becomes useful once Relo has attendee records, check-ins, and meeting data to monitor.
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/events/new">New event</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
