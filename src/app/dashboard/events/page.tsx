"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { EventCard } from "@/components/event-card";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";

export default function EventsPage() {
  const { events, attendees, meetings } = useAppStore(
    useShallow((state) => ({ events: state.events, attendees: state.attendees, meetings: state.meetings }))
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">Events</h1>
          <p className="mt-1 text-muted-foreground">Create, publish, import, and measure relationship outcomes.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/events/new">
            <Plus className="h-4 w-4" />
            New event
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Events" value={events.length} />
        <StatCard label="Attendees" value={attendees.length} />
        <StatCard label="Meetings" value={meetings.length} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
