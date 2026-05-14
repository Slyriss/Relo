import { describe, expect, it } from "vitest";
import { consolidatePublicSignals, consolidateRecommendation } from "./consolidation";
import type { PersonEnrichment } from "@/lib/enrichment";
import type { MatchRecommendation } from "@/types";

const enrichment: PersonEnrichment = {
  attendeeId: "att-2",
  publicProfileUrl: "https://github.com/octocat",
  industry: "Developer Tools",
  likelyFocus: "developer adoption",
  companyNews: ["Developer platforms are consolidating around trusted workflows."],
  confidence: 0.8,
  scannedAt: "2026-01-01T00:00:00.000Z",
  strategy: ["Ask about developer adoption.", "Compare workflow pain.", "Offer a concrete intro."],
  signals: [
    {
      source: "github",
      label: "GitHub profile",
      value: "Public developer profile",
      confidence: 0.9,
      url: "https://github.com/octocat",
    },
    {
      source: "email",
      label: "Email lookup",
      value: "Possible account existence",
      confidence: 0.8,
    },
  ],
};

const match: MatchRecommendation = {
  attendeeId: "att-1",
  targetId: "att-2",
  score: 82,
  why: ["Developer tooling and customer goals align."],
};

describe("enrichment consolidation", () => {
  it("normalizes public signals with consent and freshness metadata", () => {
    const signals = consolidatePublicSignals(enrichment, new Date("2026-01-02T00:00:00.000Z"));

    expect(signals[0]).toMatchObject({
      source: "github",
      kind: "technical",
      sourceWeight: 0.75,
      consent: { required: false, allowedForRecommendation: true },
    });
    expect(signals[1]).toMatchObject({
      source: "email",
      consent: { required: true, allowedForRecommendation: false },
    });
  });

  it("keeps attendee match score dominant and blocks sensitive lookup signals", () => {
    const recommendation = consolidateRecommendation(match, enrichment, new Date("2026-01-02T00:00:00.000Z"));

    expect(recommendation.scores.baseMatch).toBe(82);
    expect(recommendation.scores.final).toBeGreaterThan(70);
    expect(recommendation.consent.blockedSignalCount).toBe(1);
    expect(recommendation.strategy.avoidClaims[0]).toContain("account-existence");
  });
});
