import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateRange } from "@/lib/utils";
import type { Event } from "@/types";

export function EventCard({ event }: { event: Event }) {
  const isPast = new Date(event.endsAt) < new Date();

  return (
    <Card className={isPast ? "opacity-80" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg">{event.title}</CardTitle>
          <div className="flex shrink-0 gap-1.5">
            {isPast ? (
              <Badge className="text-muted-foreground">Past</Badge>
            ) : (
              <Badge className={event.status === "published" ? "border-primary/30 text-primary" : ""}>
                {event.status}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
        <div className="grid gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            {formatDateRange(event.startsAt, event.endsAt)}
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {event.venue}
          </span>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href={`/dashboard/events/${event.id}`}>{isPast ? "View report" : "Manage"}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
