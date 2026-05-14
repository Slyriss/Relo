"use client";

import { useShallow } from "zustand/react/shallow";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";

export default function OrganizationPage() {
  const org = useAppStore((state) => state.organization);
  const user = useAppStore((state) => state.user);
  const events = useAppStore(useShallow((state) => state.events));
  const attendees = useAppStore(useShallow((state) => state.attendees));

  const upcomingEvents = events.filter((e) => new Date(e.endsAt) >= new Date());
  const pastEvents = events.filter((e) => new Date(e.endsAt) < new Date());

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">{org.name}</h1>
        <p className="mt-1 text-muted-foreground">Owner workspace — organizer permissions across all events.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total events" value={events.length} />
        <StatCard label="Upcoming events" value={upcomingEvents.length} />
        <StatCard label="Attendee records" value={attendees.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Team members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user ? (
              <div className="flex items-center justify-between rounded-xl bg-muted p-3 text-sm">
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
                <Badge className="border-primary/30 text-primary capitalize">{user.role}</Badge>
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground">Invite additional organizers via Supabase Auth when connected to a live project.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-muted px-3 py-2">
              <span className="text-muted-foreground">Upcoming</span>
              <span className="font-semibold">{upcomingEvents.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted px-3 py-2">
              <span className="text-muted-foreground">Past</span>
              <span className="font-semibold">{pastEvents.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted px-3 py-2">
              <span className="text-muted-foreground">Total attendee records</span>
              <span className="font-semibold">{attendees.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Owners can create events, import attendees, view organizer analytics, and access event-level meeting notes.</p>
            <p>Row-level security policies in Supabase ensure organizers only see data for their own organization. Attendees only see their own profile and matches.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
