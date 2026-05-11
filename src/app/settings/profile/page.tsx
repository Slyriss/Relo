"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";

export default function ProfileSettingsPage() {
  const attendee = useAppStore((state) => state.attendees[0]);
  const updateAttendee = useAppStore((state) => state.updateAttendee);
  const [headline, setHeadline] = useState(attendee?.headline ?? "");

  if (!attendee) return null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Input value={attendee.name} readOnly />
          <Input value={attendee.company} readOnly />
          <Input value={headline} onChange={(event) => setHeadline(event.target.value)} />
          <Button onClick={() => updateAttendee({ ...attendee, headline, profileComplete: true })}>
            Save profile
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
