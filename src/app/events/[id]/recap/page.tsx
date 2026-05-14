"use client";

import { use, useMemo, useState } from "react";
import { CalendarClock, Copy, Mail, Bell, CheckCircle2 } from "lucide-react";
import { ExportActions } from "@/components/export-actions";
import { FollowupStatusBadge } from "@/components/followup-status-badge";
import { mockFollowup } from "@/lib/ai/followup";
import { buildRecapCsv } from "@/lib/exports";
import { getFollowupStatus } from "@/lib/analytics";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";

export default function RecapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const event = useAppStore((state) => state.events.find((item) => item.id === id || item.slug === id));
  const eventId = event?.id ?? id;
  const attendees = useAppStore(useShallow((state) => state.attendees.filter((attendee) => attendee.eventId === eventId)));
  const meetings = useAppStore(useShallow((state) => state.meetings.filter((meeting) => meeting.eventId === eventId)));
  const sender = attendees[0];
  const [overrides, setOverrides] = useState<Record<string, "drafted" | "copied" | "sent" | "reminded">>({});
  const committedMeetings = meetings.filter((meeting) => meeting.promisedAction || meeting.dueDate);
  const permissionCount = meetings.filter((meeting) => meeting.permissionToContact).length;
  const csv = useMemo(
    () => (event ? buildRecapCsv(event, attendees, meetings) : ""),
    [attendees, event, meetings]
  );

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 pb-28 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">Post-event recap</h1>
          <p className="mt-1 text-muted-foreground">People met, notes captured, and follow-ups ready to send.</p>
        </div>
        {event ? <ExportActions csv={csv} filename={`${event.slug}-attendee-recap.csv`} pdfLabel="Recap PDF" /> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="People met" value={meetings.length} />
        <StatCard label="Follow-ups due" value={committedMeetings.length} />
        <StatCard label="Permission captured" value={permissionCount} />
      </div>
      <div className="grid gap-4">
        {meetings.map((meeting, index) => {
          const recipient = attendees.find((attendee) => attendee.id === meeting.attendeeBId) ?? attendees[1];
          if (!sender || !recipient) return null;
          const status = overrides[meeting.id] ?? getFollowupStatus(index);
          const draft = mockFollowup({ meeting, sender, recipient });
          return (
            <Card key={meeting.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle>{recipient.name}</CardTitle>
                  <FollowupStatusBadge status={status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2 rounded-xl border bg-background p-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Topic</p>
                    <p>{meeting.topic || meeting.note}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Promised action</p>
                    <p>{meeting.promisedAction || "No explicit action captured yet"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Owner</p>
                    <p className="capitalize">{meeting.owner || "me"}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 text-xs font-semibold uppercase text-muted-foreground">
                      <CalendarClock className="h-3.5 w-3.5" />
                      Due / channel
                    </p>
                    <p>
                      {meeting.dueDate || "No date"} · {meeting.followupChannel || "email"}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {meeting.permissionToContact === false
                    ? "No permission captured. Treat this as internal notes only."
                    : "Permission to follow up captured."}
                </p>
                <div className="rounded-xl bg-muted p-4 text-sm">{draft}</div>
                <div className="flex flex-wrap gap-2 print:hidden">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void navigator.clipboard?.writeText(draft);
                      setOverrides((current) => ({ ...current, [meeting.id]: "copied" }));
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    Copied
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setOverrides((current) => ({ ...current, [meeting.id]: "sent" }))}>
                    <Mail className="h-4 w-4" />
                    Sent
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setOverrides((current) => ({ ...current, [meeting.id]: "reminded" }))}>
                    <Bell className="h-4 w-4" />
                    Reminder
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setOverrides((current) => ({ ...current, [meeting.id]: "drafted" }))}>
                    <CheckCircle2 className="h-4 w-4" />
                    Drafted
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
