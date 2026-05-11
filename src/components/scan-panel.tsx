"use client";

import { Check, QrCode, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useShallow } from "zustand/react/shallow";
import { queueMeeting, syncQueuedMeetings } from "@/lib/offline/meeting-queue";
import { useAppStore } from "@/lib/store";
import type { Attendee, Meeting } from "@/types";

export function ScanPanel({ eventId, scannedAttendeeId }: { eventId: string; scannedAttendeeId?: string }) {
  const attendees = useAppStore(useShallow((state) => state.attendees.filter((attendee) => attendee.eventId === eventId)));
  const logMeeting = useAppStore((state) => state.logMeeting);
  const current = attendees[0];
  const [targetId, setTargetId] = useState(scannedAttendeeId ?? attendees[1]?.id ?? "");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [draft, setDraft] = useState("");
  const [draftLoading, setDraftLoading] = useState(false);
  const target = useMemo(() => attendees.find((attendee) => attendee.id === targetId), [attendees, targetId]);

  useEffect(() => {
    const sync = () =>
      syncQueuedMeetings(async (meeting) => {
        logMeeting({ ...meeting, synced: true });
      }).then(() => setStatus("Offline meetings synced."));
    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
  }, [logMeeting]);

  async function save() {
    if (!current || !target) return;
    const meeting: Meeting = {
      id: crypto.randomUUID(),
      eventId,
      attendeeAId: current.id,
      attendeeBId: target.id,
      note,
      createdAt: new Date().toISOString(),
      synced: navigator.onLine
    };

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
    setNote("");
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
        <select
          className="h-11 rounded-xl border bg-background px-3 text-sm"
          value={targetId}
          onChange={(event) => setTargetId(event.target.value)}
        >
          {attendees
            .filter((attendee) => attendee.id !== current?.id)
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
        <Textarea placeholder="Quick note, next step, or intro promised" value={note} onChange={(event) => setNote(event.target.value)} />
        <Button onClick={save}>
          <Check className="h-4 w-4" />
          Confirm meeting
        </Button>
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
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
