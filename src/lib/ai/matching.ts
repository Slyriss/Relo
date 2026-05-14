import { bioSimilarity } from "@/lib/ai/embeddings";
import type { Attendee, Goal, MatchRecommendation } from "@/types";

// Canonical pair key — always sorted so (a,b) === (b,a)
function goalPairKey(a: Goal, b: Goal): string {
  return [a, b].sort().join(":");
}

// Explicit score + reason for every goal combination.
// Score represents mutual value of a meeting between someone with goal A and goal B.
// "learning ↔ fundraising" is intentionally modest — the investor signal handles real investors.
const GOAL_PAIRS: Record<string, { score: number; reason: string }> = {
  "fundraising:learning":   { score: 16, reason: "Learning agenda often signals investor interest" },
  "fundraising:partnerships": { score: 18, reason: "Strategic or co-investment alignment" },
  "customers:fundraising":  { score: 12, reason: "Customer proof-points strengthen a raise" },
  "fundraising:hiring":     { score: 6,  reason: "Operator experience at a fundraising stage" },
  "fundraising:fundraising":{ score: 10, reason: "Co-raise or investor intro exchange" },
  "hiring:learning":        { score: 20, reason: "Growth mindset fits a mentorship or hiring dynamic" },
  "customers:hiring":       { score: 12, reason: "Customer feedback sharpens hiring priorities" },
  "hiring:partnerships":    { score: 12, reason: "Ecosystem programs expand hiring reach" },
  "hiring:hiring":          { score: 8,  reason: "Talent pipeline and referral opportunity" },
  "customers:partnerships": { score: 25, reason: "Channel, co-sell, or design-partner relationship likely" },
  "learning:partnerships":  { score: 18, reason: "Knowledge exchange enriches ecosystem thinking" },
  "partnerships:partnerships":{ score: 14, reason: "Aligned ecosystem interests — natural co-builders" },
  "customers:learning":     { score: 14, reason: "Domain insight from an active buyer or practitioner" },
  "customers:customers":    { score: 12, reason: "Shared GTM focus — referral and intro value" },
  "learning:learning":      { score: 20, reason: "Mutual curiosity — rich knowledge exchange likely" },
};

// Greedily pick up to 2 goal pairings without reusing the same source or target goal.
// Second match counts at 50% to reward depth without inflating multi-goal profiles.
function bestGoalPairs(sourceGoals: Goal[], targetGoals: Goal[]) {
  const candidates: Array<{ sg: Goal; tg: Goal; score: number; reason: string }> = [];

  for (const sg of sourceGoals) {
    for (const tg of targetGoals) {
      const key = goalPairKey(sg, tg);
      const pair = GOAL_PAIRS[key];
      if (pair) candidates.push({ sg, tg, ...pair });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  const usedSrc = new Set<Goal>();
  const usedTgt = new Set<Goal>();
  const reasons: string[] = [];
  let total = 0;
  let count = 0;

  for (const c of candidates) {
    if (usedSrc.has(c.sg) || usedTgt.has(c.tg)) continue;
    usedSrc.add(c.sg);
    usedTgt.add(c.tg);
    total += count === 0 ? c.score : Math.round(c.score * 0.5);
    reasons.push(c.reason);
    count++;
    if (count >= 2) break;
  }

  return { score: total, reasons };
}

export function scoreMatch(source: Attendee, target: Attendee, bioSim = 0): MatchRecommendation {
  if (source.id === target.id) {
    return { attendeeId: source.id, targetId: target.id, score: 0, why: [] };
  }

  let score = 20; // base: shared event context
  const why: string[] = [];

  // Goal pairing — primary signal, up to ~37 points
  const { score: goalScore, reasons: goalReasons } = bestGoalPairs(source.goals, target.goals);
  score += goalScore;
  why.push(...goalReasons);

  // Investor signal — only when source is raising and target's profile looks like an investor
  if (
    source.goals.includes("fundraising") &&
    /venture|capital|invest/i.test(`${target.industry ?? ""} ${target.title}`)
  ) {
    score += 18;
    why.push("Investor profile directly aligns with fundraising goals");
  }

  // Industry signal — goal-conditioned weight
  if (source.industry && target.industry) {
    if (source.industry === target.industry) {
      score += 12;
      why.push(`Both in ${source.industry} — shared market context`);
    } else if (source.goals.some((g) => g === "partnerships" || g === "customers")) {
      score += 8;
      why.push(`${target.industry} perspective opens a cross-sector opportunity`);
    } else {
      score += 3;
    }
  }

  // Seniority gap — only scores when a learning dynamic is actually plausible
  const seniorityGap = Math.abs((source.seniority ?? 3) - (target.seniority ?? 3));
  if (seniorityGap >= 2 && (source.goals.includes("learning") || target.goals.includes("learning"))) {
    score += 8;
    why.push("Seniority difference supports a genuine learning dynamic");
  }

  // Prefer targets with complete profiles — higher signal quality
  if (target.profileComplete) {
    score += 5;
  }

  // Bio similarity — Jaccard word overlap (or real embedding cosine when API key present)
  // Up to 10 points; only surfaces a reason when the signal is strong enough to mention
  const bioBonus = Math.round(bioSim * 10);
  score += bioBonus;
  if (bioBonus >= 4) {
    why.push("Strong background overlap across domains");
  }

  return {
    attendeeId: source.id,
    targetId: target.id,
    score: Math.min(100, Math.round(score)),
    why: why.length ? why : ["Relevant event context and background"]
  };
}

export function scoreMatches(source: Attendee, attendees: Attendee[]) {
  return attendees
    .filter((attendee) => attendee.id !== source.id)
    .map((attendee) => scoreMatch(source, attendee, bioSimilarity(source.bio, attendee.bio)))
    .sort((a, b) => b.score - a.score);
}
