import { describe, expect, it } from "vitest";
import { getConnectorStats, getOrganizerIntroRecommendations, getUnmatchedAttendees } from "@/lib/analytics";
import { buildSponsorCsv } from "@/lib/exports";
import { demoAttendees, demoEvent, demoMeetings } from "@/lib/demo-data";

describe("organizer analytics", () => {
  it("computes connector and unmatched cohorts", () => {
    const connectors = getConnectorStats(demoAttendees, demoMeetings);
    const unmatched = getUnmatchedAttendees(demoAttendees, demoMeetings);

    expect(connectors[0].count).toBeGreaterThanOrEqual(connectors[1].count);
    expect(unmatched.length).toBeGreaterThan(0);
  });

  it("creates recommended intro cards", () => {
    const intros = getOrganizerIntroRecommendations(demoAttendees, 3);
    expect(intros).toHaveLength(3);
    expect(intros[0].score).toBeGreaterThan(0);
  });

  it("exports sponsor report csv", () => {
    const csv = buildSponsorCsv(demoEvent, demoAttendees, demoMeetings);
    expect(csv).toContain("attendees_invited");
    expect(csv).toContain("connector:");
  });
});
