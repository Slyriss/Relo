import { describe, expect, it } from "vitest";
import { demoAttendees } from "@/lib/demo-data";
import { scoreMatches } from "@/lib/ai/matching";
import { enrichAttendee, rankEnrichedRecommendations } from "@/lib/enrichment";

describe("public-signal enrichment", () => {
  it("creates a deterministic networking brief from attendee signup data", () => {
    const attendee = demoAttendees.find((item) => item.id === "att-1")!;
    const enrichment = enrichAttendee(attendee, new Date("2026-01-01T00:00:00.000Z"));

    expect(enrichment.publicProfileUrl).toContain("linkedin.com");
    expect(enrichment.companyNews).toEqual([]);
    expect(enrichment.signals.some((signal) => signal.label === "Submitted public profile")).toBe(true);
    expect(enrichment.strategy).toHaveLength(3);
    expect(enrichment.confidence).toBeGreaterThan(0.5);
  });

  it("does not fabricate a LinkedIn profile URL when one was not supplied or resolved", () => {
    const enrichment = enrichAttendee(
      {
        ...demoAttendees[0],
        linkedinUrl: undefined,
      },
      new Date("2026-01-01T00:00:00.000Z")
    );

    expect(enrichment.publicProfileUrl).toBeUndefined();
    expect(enrichment.signals[0].label).toBe("LinkedIn not verified");
    expect(enrichment.signals[0].url).toBeUndefined();
  });

  it("returns the highest priority enriched recommendations", () => {
    const source = demoAttendees[0];
    const recommendations = scoreMatches(source, demoAttendees);
    const ranked = rankEnrichedRecommendations(demoAttendees, recommendations, 3);

    expect(ranked).toHaveLength(3);
    expect(ranked[0].priorityScore).toBeGreaterThanOrEqual(ranked[1].priorityScore);
    expect(ranked.every((item) => item.enrichment.signals.length >= 3)).toBe(true);
  });
});
