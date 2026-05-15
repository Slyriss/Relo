"use client";

import { CalendarPlus, QrCode, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MeetingCaptureForm } from "@/components/meeting-capture-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useShallow } from "zustand/react/shallow";
import { queueMeeting, syncQueuedMeetings } from "@/lib/offline/meeting-queue";
import { useAppStore, useCurrentEventAttendee } from "@/lib/store";
import type { Attendee, Meeting } from "@/types";

export function ScanPanel({ eventId, scannedAttendeeId }: { eventId: string; scannedAttendeeId?: string }) {
  const attendees = useAppStore(useShallow((state) => state.attendees.filter((attendee) => attendee.eventId === eventId)));
  const logMeeting = useAppStore((state) => state.logMeeting);
  const current = useCurrentEventAttendee(eventId);
  const availableTargets = useMemo(
    () => (current ? attendees.filter((attendee) => attendee.id !== current.id) : []),
    [attendees, current]
  );
  const [targetId, setTargetId] = useState("");
  const [status, setStatus] = useState("");
  const [draft, setDraft] = useState("");
  const [draftLoading, setDraftLoading] = useState(false);

  function buildCalendarUrl(recipientName: string, body: string) {
    const start = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    start.setHours(10, 0, 0, 0);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(".", "").slice(0, 15) + "Z";
    return (
      `https://calendar.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(`Follow-up with ${recipientName}`)}` +
      `&dates=${fmt(start)}/${fmt(end)}` +
      `&details=${encodeURIComponent(body)}`
    );
  }
  const target = useMemo(() => attendees.find((attendee) => attendee.id === targetId), [attendees, targetId]);

  useEffect(() => {
    if (!current) return;
    const scannedTarget = availableTargets.find((attendee) => attendee.id === scannedAttendeeId);
    const currentTargetStillValid = availableTargets.some((attendee) => attendee.id === targetId);
    if (!currentTargetStillValid) setTargetId(scannedTarget?.id ?? availableTargets[0]?.id ?? "");
  }, [availableTargets, current, scannedAttendeeId, targetId]);

  useEffect(() => {
    const sync = () =>
      syncQueuedMeetings(async (meeting) => {
        logMeeting({ ...meeting, synced: true });
      }).then(() => setStatus("Offline meetings synced."));
    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
  }, [logMeeting]);

  async function save(meeting: Meeting) {
    if (!current || !target) return;

    if (navigator.onLine) {
      logMeeting(meeting);
      setStatus("Meeting logged.");
      setDraftLoading(true);
      fetch("/api/followup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ meeting, sender: current, recipient: target })
        })
          .then((res) => res.json())
          .then((data: { draft?: string }) => setDraft(data.draft ?? ""))
          .catch(() => null)
          .finally(() => setDraftLoading(false));
    } else {
      await queueMeeting(meeting);
      setStatus("Saved offline. Relo will sync when connection returns.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          Log a meeting
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {!current ? (
          <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
            No attendee profile is linked to this account for this event.
          </div>
        ) : null}
        <select
          className="h-11 rounded-xl border bg-background px-3 text-sm"
          value={targetId}
          onChange={(event) => setTargetId(event.target.value)}
          disabled={!current || availableTargets.length === 0}
        >
          {availableTargets
            .map((attendee: Attendee) => (
              <option key={attendee.id} value={attendee.id}>
                {attendee.name} - {attendee.company}
              </option>
            ))}
        </select>
        {target ? (
          <div className="rounded-xl bg-muted p-4 text-sm">
            <div className="font-medium">{target.name}</div>
            <div className="text-muted-foreground">
              {target.title}, {target.company}
            </div>
          </div>
        ) : null}
        {current && target ? (
          <MeetingCaptureForm eventId={eventId} current={current} target={target} onSave={save} />
        ) : null}
        {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
        {draftLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : null}
        {draft && !draftLoading ? (
          <div className="rounded-xl border bg-muted/50 p-4 text-sm">
            <div className="mb-2 flex items-center gap-1.5 font-medium">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Suggested follow-up
            </div>
            <p className="text-muted-foreground">{draft}</p>
            {target ? (
              <a
                href={buildCalendarUrl(target.name, draft)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/20"
              >
                <CalendarPlus className="h-3.5 w-3.5" />
                Schedule 30-min follow-up
              </a>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
