import { scoreMatches } from "@/lib/ai/matching";
import type { Attendee, Meeting } from "@/types";

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
