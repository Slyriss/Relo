"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, UserRoundX } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CsvUploadDropzone } from "@/components/csv-upload-dropzone";
import { ExportActions } from "@/components/export-actions";
import { QrBadgeCard } from "@/components/qr-badge-card";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getConnectorStats, getOrganizerIntroRecommendations, getUnmatchedAttendees } from "@/lib/analytics";
import { buildSponsorCsv } from "@/lib/exports";
import { useShallow } from "zustand/react/shallow";
import { useAppStore, useEvent } from "@/lib/store";

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const event = useEvent(params.id);
  const attendees = useAppStore(useShallow((state) => state.attendees.filter((attendee) => attendee.eventId === params.id)));
  const meetings = useAppStore(useShallow((state) => state.meetings.filter((meeting) => meeting.eventId === params.id)));

  if (!event) return <div>Event not found.</div>;

  const completed = attendees.filter((attendee) => attendee.profileComplete).length;
  const followupRate = Math.round((meetings.length / Math.max(attendees.length, 1)) * 100);
  const connectors = getConnectorStats(attendees, meetings);
  const unmatched = getUnmatchedAttendees(attendees, meetings);
  const intros = getOrganizerIntroRecommendations(attendees);
  const sponsorCsv = buildSponsorCsv(event, attendees, meetings);
  const chart = [
    { name: "Invited", value: attendees.length },
    { name: "Complete", value: completed },
    { name: "Meetings", value: meetings.length },
    { name: "Follow-up", value: followupRate }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">{event.title}</h1>
          <p className="mt-1 text-muted-foreground">{event.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportActions csv={sponsorCsv} filename={`${event.slug}-sponsor-report.csv`} pdfLabel="Sponsor PDF" />
          <Button asChild variant="outline">
            <Link href={`/events/${event.id}`}>Open attendee view</Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Attendees invited" value={attendees.length} />
        <StatCard label="Profiles completed" value={completed} />
        <StatCard label="Meetings logged" value={meetings.length} />
        <StatCard label="Active live" value={8} />
        <StatCard label="Follow-up rate" value={`${followupRate}%`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Connector drilldown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {connectors.slice(0, 5).map(({ attendee, count }) => (
              <div key={attendee.id} className="rounded-xl bg-muted p-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">{attendee.name}</span>
                  <Badge>{count} meetings</Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {attendee.title}, {attendee.company}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRoundX className="h-5 w-5 text-primary" />
              Unmatched attendees
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {unmatched.slice(0, 6).map((attendee) => (
              <div key={attendee.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted p-3 text-sm">
                <span>{attendee.name}</span>
                <span className="text-muted-foreground">{attendee.goals[0]}</span>
              </div>
            ))}
            {!unmatched.length ? <p className="text-sm text-muted-foreground">Every attendee has at least one logged meeting.</p> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sponsor report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-xl bg-muted p-3">
              Engagement score <span className="float-right font-semibold">84</span>
            </div>
            <div className="rounded-xl bg-muted p-3">
              Popular companies <span className="float-right font-semibold">{new Set(attendees.map((a) => a.company)).size}</span>
            </div>
            <div className="rounded-xl bg-muted p-3">
              Intro opportunity <span className="float-right font-semibold">{intros.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Recommended organizer intros
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-2">
          {intros.map((intro) => (
            <div key={`${intro.source.id}-${intro.target.id}`} className="rounded-xl border bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">
                  {intro.source.name} <ArrowRight className="mx-1 inline h-3.5 w-3.5" /> {intro.target.name}
                </div>
                <Badge className="border-primary/30 text-primary">{intro.score}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{intro.why[0]}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>{intro.source.company}</Badge>
                <Badge>{intro.target.company}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Engagement dashboard</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#4f46e5" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <CsvUploadDropzone eventId={event.id} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        {attendees[0] ? <QrBadgeCard attendee={attendees[0]} /> : null}
        <Card>
          <CardHeader>
            <CardTitle>Connector detail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {connectors.slice(0, 5).map(({ attendee, count }) => (
              <div key={attendee.id} className="flex items-center justify-between rounded-xl bg-muted p-3 text-sm">
                <span>{attendee.name}</span>
                <span className="text-muted-foreground">{count} meetings</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
