import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateRange, sanitizeDisplayText } from "@/lib/utils";
import type { Event } from "@/types";

export function EventCard({ event }: { event: Event }) {
  const isPast = new Date(event.endsAt) < new Date();
  const title = sanitizeDisplayText(event.title, "Event title needs review");
  const description = sanitizeDisplayText(event.description, "Description needs review");
  const venue = sanitizeDisplayText(event.venue, "Venue needs review");

  return (
    <Card className={isPast ? "opacity-80" : ""}>
      <CardHeader>
        <div className="flex min-w-0 items-start justify-between gap-3">
          <CardTitle className="min-w-0 break-words text-lg leading-snug">{title}</CardTitle>
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
        <p className="line-clamp-2 break-words text-sm text-muted-foreground">{description}</p>
        <div className="grid gap-2 text-sm text-muted-foreground">
          <span className="flex min-w-0 items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0" />
            {formatDateRange(event.startsAt, event.endsAt)}
          </span>
          <span className="flex min-w-0 items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="min-w-0 truncate">{venue}</span>
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
