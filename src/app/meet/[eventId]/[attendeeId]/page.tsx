"use client";

import { use } from "react";
import { ParticipantRouteGuard } from "@/components/participant-route-guard";
import { ScanPanel } from "@/components/scan-panel";
import { useEvent } from "@/lib/store";

export default function MeetPage({ params }: { params: Promise<{ eventId: string; attendeeId: string }> }) {
  const { eventId, attendeeId } = use(params);
  const event = useEvent(eventId);
  const resolvedEventId = event?.id ?? eventId;

  return (
    <ParticipantRouteGuard eventId={eventId}>
      <main className="mx-auto max-w-xl space-y-5 px-4 py-6 sm:px-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">Confirm meeting</h1>
          <p className="mt-1 text-muted-foreground">This QR badge is ready to log as a real-world conversation.</p>
        </div>
        <ScanPanel eventId={resolvedEventId} scannedAttendeeId={attendeeId} />
      </main>
    </ParticipantRouteGuard>
  );
}
