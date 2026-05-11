"use client";

import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";

export default function OrgPage({ params }: { params: { slug: string } }) {
  const org = useAppStore((state) => state.organization);
  const events = useAppStore((state) => state.events);
  const attendees = useAppStore((state) => state.attendees);

  if (params.slug !== org.slug) return <main className="p-6">Organization not found.</main>;

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">{org.name}</h1>
        <p className="mt-1 text-muted-foreground">Owner workspace with organizer permissions.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Events" value={events.length} />
        <StatCard label="Members" value={3} />
        <StatCard label="Attendee records" value={attendees.length} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Owners can create events, import attendees, view organizer analytics, and access event-level notes under the RLS policies in Supabase.
        </CardContent>
      </Card>
    </main>
  );
}
