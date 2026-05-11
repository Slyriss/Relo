import { mockFollowup } from "@/lib/ai/followup";
import { getConnectorStats, getFollowupStatus, getUnmatchedAttendees } from "@/lib/analytics";
import type { Attendee, Event, Meeting } from "@/types";

export function buildRecapCsv(event: Event, attendees: Attendee[], meetings: Meeting[]) {
  const rows = [
    ["event", "person_met", "company", "title", "note", "followup_status", "followup_draft"],
    ...meetings.map((meeting, index) => {
      const sender = attendees.find((attendee) => attendee.id === meeting.attendeeAId) ?? attendees[0];
      const recipient = attendees.find((attendee) => attendee.id === meeting.attendeeBId) ?? attendees[1];
      return [
        event.title,
        recipient?.name ?? "Unknown",
        recipient?.company ?? "",
        recipient?.title ?? "",
        meeting.note,
        getFollowupStatus(index),
        sender && recipient ? mockFollowup({ meeting, sender, recipient }) : ""
      ];
    })
  ];

  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

export function buildSponsorCsv(event: Event, attendees: Attendee[], meetings: Meeting[]) {
  const connectors = getConnectorStats(attendees, meetings).slice(0, 10);
  const unmatched = getUnmatchedAttendees(attendees, meetings);
  const rows = [
    ["report", "metric", "value"],
    [event.title, "attendees_invited", attendees.length],
    [event.title, "meetings_logged", meetings.length],
    [event.title, "profiles_completed", attendees.filter((attendee) => attendee.profileComplete).length],
    [event.title, "unmatched_attendees", unmatched.length],
    ...connectors.map(({ attendee, count }) => [event.title, `connector:${attendee.name}`, count])
  ];

  return rows.map((row) => row.map((cell) => escapeCsvCell(String(cell))).join(",")).join("\n");
}

function escapeCsvCell(value: string) {
  if (/[",\n\r]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}
