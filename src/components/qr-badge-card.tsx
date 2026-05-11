"use client";

import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent } from "@/components/ui/card";
import type { Attendee } from "@/types";

export function QrBadgeCard({ attendee }: { attendee: Attendee }) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  const url = `${baseUrl}/meet/${attendee.eventId}/${attendee.id}`;
  return (
    <Card className="max-w-sm">
      <CardContent className="space-y-4 pt-5 text-center">
        <div className="mx-auto flex w-fit rounded-xl border bg-white p-4">
          <QRCodeSVG value={url} size={168} />
        </div>
        <div>
          <div className="font-semibold">{attendee.name}</div>
          <div className="text-sm text-muted-foreground">
            {attendee.title}, {attendee.company}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
