import type { Attendee, Event, User } from "@/types";

export function appHomeForUser(user: User, events: Event[], attendees: Attendee[]) {
  if (user.role === "admin" || user.role === "organizer") return "/dashboard";

  const hasLinkedEvent = events.some((item) =>
    attendees.some(
      (attendee) =>
        attendee.eventId === item.id &&
        (attendee.userId === user.id || attendee.email.toLowerCase() === user.email.toLowerCase())
    )
  );

  return hasLinkedEvent ? "/events" : "/setup";
}
