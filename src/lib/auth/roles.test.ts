import { describe, expect, it } from "vitest";
import { filterWorkspaceForRole, isAdminRole } from "@/lib/auth/roles";
import type { Attendee, Event, Meeting, MeetingRequest, User } from "@/types";

const admin: User = {
  id: "admin-1",
  email: "admin@relo.test",
  name: "Admin",
  role: "organizer",
  visibility: {} as User["visibility"],
  crawlStatus: "idle",
};

const attendeeUser: User = {
  id: "user-1",
  email: "maya@orbit.ai",
  name: "Maya",
  role: "attendee",
  visibility: {} as User["visibility"],
  crawlStatus: "idle",
};

const events: Event[] = [
  { id: "event-1", organizationId: "org-1", slug: "summit", title: "Summit", description: "", venue: "", startsAt: "2026-01-01T00:00:00.000Z", endsAt: "2026-01-01T01:00:00.000Z", status: "published" },
  { id: "event-2", organizationId: "org-1", slug: "private", title: "Private", description: "", venue: "", startsAt: "2026-01-02T00:00:00.000Z", endsAt: "2026-01-02T01:00:00.000Z", status: "draft" },
];

const attendees: Attendee[] = [
  { id: "att-1", eventId: "event-1", userId: "user-1", name: "Maya", email: "maya@orbit.ai", company: "Orbit", title: "Founder", bio: "", goals: ["fundraising"], profileComplete: true },
  { id: "att-2", eventId: "event-1", name: "Jon", email: "jon@fund.test", company: "Fund", title: "Partner", bio: "", goals: ["learning"], profileComplete: true },
  { id: "att-3", eventId: "event-2", name: "Other", email: "other@test.dev", company: "Other", title: "Ops", bio: "", goals: ["hiring"], profileComplete: true },
];

const meetings: Meeting[] = [
  { id: "meeting-1", eventId: "event-1", attendeeAId: "att-1", attendeeBId: "att-2", note: "ok", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "meeting-2", eventId: "event-2", attendeeAId: "att-3", attendeeBId: "att-2", note: "hidden", createdAt: "2026-01-01T00:00:00.000Z" },
];

const meetingRequests: MeetingRequest[] = [
  { id: "req-1", eventId: "event-1", requesterId: "att-1", targetId: "att-2", status: "pending", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "req-2", eventId: "event-1", requesterId: "att-2", targetId: "att-1", status: "pending", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "req-3", eventId: "event-1", requesterId: "att-2", targetId: "att-3", status: "pending", createdAt: "2026-01-01T00:00:00.000Z" },
];

const workspace = {
  user: attendeeUser,
  organization: { id: "org-1", name: "Org", slug: "org", ownerId: "admin-1" },
  events,
  attendees,
  meetings,
  meetingRequests,
  checkIns: [
    { id: "ci-1", eventId: "event-1", attendeeId: "att-1", checkedInAt: "2026-01-01T00:00:00.000Z" },
    { id: "ci-2", eventId: "event-2", attendeeId: "att-3", checkedInAt: "2026-01-01T00:00:00.000Z" },
  ],
};

describe("role helpers", () => {
  it("treats organizer and admin roles as admin access", () => {
    expect(isAdminRole("organizer")).toBe(true);
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("attendee")).toBe(false);
  });

  it("returns full workspace data for admins", () => {
    const scoped = filterWorkspaceForRole({ ...workspace, user: admin });
    expect(scoped.organization?.id).toBe("org-1");
    expect(scoped.events).toHaveLength(2);
    expect(scoped.meetings).toHaveLength(2);
  });

  it("scopes attendee workspace to their event and own relationship records", () => {
    const scoped = filterWorkspaceForRole(workspace);
    expect(scoped.organization).toBeNull();
    expect(scoped.events.map((event) => event.id)).toEqual(["event-1"]);
    expect(scoped.attendees.map((attendee) => attendee.id)).toEqual(["att-1", "att-2"]);
    expect(scoped.attendees.find((attendee) => attendee.id === "att-2")?.email).toBe("");
    expect(scoped.attendees.find((attendee) => attendee.id === "att-2")?.linkedinUrl).toBeUndefined();
    expect(scoped.meetings.map((meeting) => meeting.id)).toEqual(["meeting-1"]);
    expect(scoped.meetingRequests.map((request) => request.id)).toEqual(["req-1", "req-2"]);
    expect(scoped.checkIns.map((checkIn) => checkIn.id)).toEqual(["ci-1"]);
  });
});
