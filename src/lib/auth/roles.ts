import type { Attendee, CheckIn, Event, Meeting, MeetingRequest, Organization, User } from "@/types";

export type WorkspaceScope = {
  user: User | null;
  organization: Organization | null;
  events: Event[];
  attendees: Attendee[];
  meetings: Meeting[];
  meetingRequests: MeetingRequest[];
  checkIns: CheckIn[];
};

export function isAdminRole(role: User["role"] | undefined) {
  return role === "admin" || role === "organizer";
}

export function isAttendeeRole(role: User["role"] | undefined) {
  return role === "attendee";
}

export function attendeeBelongsToUser(attendee: Pick<Attendee, "email"> & { userId?: string | null }, user: Pick<User, "id" | "email">) {
  return attendee.userId === user.id || attendee.email.toLowerCase() === user.email.toLowerCase();
}

export function filterWorkspaceForRole(scope: WorkspaceScope): WorkspaceScope {
  const { user } = scope;
  if (!user) {
    return { ...scope, organization: null, events: [], attendees: [], meetings: [], meetingRequests: [], checkIns: [] };
  }

  if (isAdminRole(user.role)) return scope;

  const ownAttendeeIds = new Set(
    scope.attendees
      .filter((attendee) => attendeeBelongsToUser(attendee, user))
      .map((attendee) => attendee.id)
  );
  const eventIds = new Set(
    scope.attendees
      .filter((attendee) => ownAttendeeIds.has(attendee.id))
      .map((attendee) => attendee.eventId)
  );
  const scopedAttendees = scope.attendees
    .filter((attendee) => eventIds.has(attendee.eventId))
    .map((attendee) =>
      ownAttendeeIds.has(attendee.id)
        ? attendee
        : {
            ...attendee,
            email: "",
            linkedinUrl: undefined,
          }
    );

  return {
    user,
    organization: null,
    events: scope.events.filter((event) => eventIds.has(event.id) && event.status === "published"),
    attendees: scopedAttendees,
    meetings: scope.meetings.filter((meeting) => ownAttendeeIds.has(meeting.attendeeAId) || ownAttendeeIds.has(meeting.attendeeBId)),
    meetingRequests: scope.meetingRequests.filter(
      (request) => ownAttendeeIds.has(request.requesterId) || ownAttendeeIds.has(request.targetId)
    ),
    checkIns: scope.checkIns.filter((checkIn) => eventIds.has(checkIn.eventId)),
  };
}
