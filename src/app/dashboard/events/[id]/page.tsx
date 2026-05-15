"use client";

import { use } from "react";
import { ArrowRight, Bookmark, CheckCircle2, Sparkles, UserRoundX } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CsvUploadDropzone } from "@/components/csv-upload-dropzone";
import { ProfilePasteImport } from "@/components/profile-paste-import";
import { ExportActions } from "@/components/export-actions";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getConnectorStats, getOrganizerIntroRecommendations, getUnmatchedAttendees } from "@/lib/analytics";
import { buildSponsorCsv } from "@/lib/exports";
import { sanitizeDisplayText } from "@/lib/utils";
import { useShallow } from "zustand/react/shallow";
import { useAppStore, useEvent } from "@/lib/store";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const event = useEvent(id);
  const eventId = event?.id ?? id;
  const attendees = useAppStore(useShallow((state) => state.attendees.filter((attendee) => attendee.eventId === eventId)));
  const meetings = useAppStore(useShallow((state) => state.meetings.filter((meeting) => meeting.eventId === eventId)));
  const meetingRequests = useAppStore(useShallow((s) => s.meetingRequests.filter((r) => r.eventId === eventId)));
  const checkIns = useAppStore(useShallow((s) => s.checkIns.filter((c) => c.eventId === eventId)));
  const facilitateMeetingRequest = useAppStore((s) => s.facilitateMeetingRequest);
  const removeMeetingRequest = useAppStore((s) => s.removeMeetingRequest);

  if (!event) return <div>Event not found.</div>;

  const completed = attendees.filter((attendee) => attendee.profileComplete).length;
  const followupRate = Math.round((meetings.length / Math.max(attendees.length, 1)) * 100);
  const connectors = getConnectorStats(attendees, meetings);
  const unmatched = getUnmatchedAttendees(attendees, meetings);
  const intros = getOrganizerIntroRecommendations(attendees);
  const sponsorCsv = buildSponsorCsv(event, attendees, meetings);
  const eventTitle = sanitizeDisplayText(event.title, "Event title needs review");
  const eventDescription = sanitizeDisplayText(event.description, "Description needs review");
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
          <h1 className="max-w-4xl break-words text-3xl font-semibold tracking-normal">{eventTitle}</h1>
          <p className="mt-1 max-w-4xl break-words text-muted-foreground">{eventDescription}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportActions csv={sponsorCsv} filename={`${event.slug}-sponsor-report.csv`} pdfLabel="Sponsor PDF" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Attendees invited" value={attendees.length} />
        <StatCard label="Profiles completed" value={completed} />
        <StatCard label="Meetings logged" value={meetings.length} />
        <StatCard label="Here now" value={checkIns.length} />
        <StatCard label="Intro requests" value={meetingRequests.filter(r => r.status === "pending").length} />
      </div>

      {/* Meeting requests */}
      {meetingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bookmark className="h-4 w-4 text-amber-500" />
              Pre-event intro requests
              <Badge className="ml-1 bg-amber-50 text-amber-700">
                {meetingRequests.filter(r => r.status === "pending").length} pending
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {meetingRequests.map((req) => {
              const requester = attendees.find((a) => a.id === req.requesterId);
              const target    = attendees.find((a) => a.id === req.targetId);
              if (!requester || !target) return null;
              return (
                <div key={req.id} className="flex items-center gap-3 rounded-xl border bg-background px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      <span className="break-words">{requester.name}</span>
                      <span className="mx-1.5 text-muted-foreground">wants to meet</span>
                      <span className="break-words">{target.name}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{requester.company} · {target.company}</p>
                    {req.note && <p className="mt-1 text-xs text-muted-foreground italic">&ldquo;{req.note}&rdquo;</p>}
                  </div>
                  {req.status === "facilitated" ? (
                    <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Facilitated
                    </span>
                  ) : (
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => facilitateMeetingRequest(req.id)}
                        className="rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        Facilitate
                      </button>
                      <button
                        onClick={() => removeMeetingRequest(req.id)}
                        className="rounded-lg border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
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
        <ProfilePasteImport eventId={event.id} />
      </div>
    </div>
  );
}
