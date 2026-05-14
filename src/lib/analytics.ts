import { scoreMatches } from "@/lib/ai/matching";
import type { Attendee, Event, Meeting } from "@/types";

export function getConnectorStats(attendees: Attendee[], meetings: Meeting[]) {
  return attendees
    .map((attendee) => {
      const count = meetings.filter(
        (meeting) => meeting.attendeeAId === attendee.id || meeting.attendeeBId === attendee.id
      ).length;
      return { attendee, count };
    })
    .sort((a, b) => b.count - a.count || a.attendee.name.localeCompare(b.attendee.name));
}

export function getUnmatchedAttendees(attendees: Attendee[], meetings: Meeting[]) {
  const metIds = new Set(meetings.flatMap((meeting) => [meeting.attendeeAId, meeting.attendeeBId]));
  return attendees.filter((attendee) => !metIds.has(attendee.id));
}

export function getOrganizerIntroRecommendations(attendees: Attendee[], limit = 6) {
  const seen = new Set<string>();
  const intros: Array<{ source: Attendee; target: Attendee; score: number; why: string[] }> = [];

  for (const source of attendees) {
    for (const match of scoreMatches(source, attendees).slice(0, 3)) {
      const pairKey = [source.id, match.targetId].sort().join(":");
      const target = attendees.find((attendee) => attendee.id === match.targetId);
      if (!target || seen.has(pairKey)) continue;
      seen.add(pairKey);
      intros.push({ source, target, score: match.score, why: match.why });
    }
  }

  return intros.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function getFollowupStatus(index: number): "drafted" | "copied" | "sent" | "reminded" {
  return ["drafted", "copied", "sent", "reminded"][index % 4] as "drafted" | "copied" | "sent" | "reminded";
}

// Events where both viewer and target attended, ordered most-recent first.
// Cross-event identity is determined by email address.
export function getSharedEventHistory(
  viewerEmail: string,
  targetEmail: string,
  attendees: Attendee[],
  events: Event[],
  meetings: Meeting[]
): Array<{ event: Event; metAtEvent: boolean }> {
  const viewerEventIds = new Set(attendees.filter((a) => a.email === viewerEmail).map((a) => a.eventId));
  const targetByEvent = new Map(attendees.filter((a) => a.email === targetEmail).map((a) => [a.eventId, a]));

  const result: Array<{ event: Event; metAtEvent: boolean }> = [];

  for (const [eventId, targetRecord] of targetByEvent) {
    if (!viewerEventIds.has(eventId)) continue;
    const event = events.find((e) => e.id === eventId);
    if (!event) continue;
    const viewerRecord = attendees.find((a) => a.email === viewerEmail && a.eventId === eventId);
    const metAtEvent = viewerRecord
      ? meetings.some(
          (m) =>
            m.eventId === eventId &&
            ((m.attendeeAId === viewerRecord.id && m.attendeeBId === targetRecord.id) ||
              (m.attendeeAId === targetRecord.id && m.attendeeBId === viewerRecord.id))
        )
      : false;
    result.push({ event, metAtEvent });
  }

  return result.sort((a, b) => new Date(b.event.startsAt).getTime() - new Date(a.event.startsAt).getTime());
}
