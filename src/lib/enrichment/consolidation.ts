import type { Goal } from "@/types";
import type { MatchRecommendation } from "@/types";
import type { PersonEnrichment, PublicSignal } from "@/lib/enrichment";

export type SignalSource =
  | "event"
  | "linkedin"
  | "company_site"
  | "company"
  | "github"
  | "news"
  | "website"
  | "website_metadata"
  | "username"
  | "username_lookup"
  | "email"
  | "email_lookup";

export type ConsolidatedPublicSignal = {
  id: string;
  attendeeId: string;
  source: SignalSource;
  kind: "identity" | "role" | "company" | "interest" | "traction" | "technical" | "market" | "contact" | "metadata";
  label: string;
  value: string;
  url?: string;
  confidence: {
    raw: number;
    band: "low" | "medium" | "high";
    reasons: string[];
  };
  sourceWeight: number;
  freshness: {
    observedAt: string;
    halfLifeDays: number;
    score: number;
  };
  consent: {
    required: boolean;
    granted: boolean;
    lawfulBasis: "attendee_consent" | "public_profile" | "organizer_legitimate_interest" | "not_applicable";
    allowedForRecommendation: boolean;
    allowedForDisplay: boolean;
    retentionDays: number;
  };
  cache: {
    cacheKey: string;
    ttlSeconds: number;
    expiresAt: string;
    revalidateAfter: string;
  };
};

export type ConsolidatedRecommendation = {
  attendeeId: string;
  targetId: string;
  scores: {
    baseMatch: number;
    publicSignal: number;
    freshness: number;
    confidence: number;
    final: number;
  };
  top3Explanation: Array<{
    rank: 1 | 2 | 3;
    reason: string;
    contribution: number;
    signalIds: string[];
    sourceLabels: string[];
  }>;
  consent: {
    displayLimited: boolean;
    blockedSignalCount: number;
    requiredActions: string[];
  };
  strategy: {
    opener: string;
    angle: Goal | "technical" | "market";
    talkingPoints: string[];
    avoidClaims: string[];
    generatedFromSignalIds: string[];
  };
};

type RecommendationExplanation = ConsolidatedRecommendation["top3Explanation"][number];

const SOURCE_WEIGHTS: Record<SignalSource, number> = {
  event: 1,
  linkedin: 0.85,
  company_site: 0.8,
  company: 0.8,
  github: 0.75,
  website: 0.65,
  website_metadata: 0.65,
  news: 0.55,
  username: 0.4,
  username_lookup: 0.4,
  email: 0.25,
  email_lookup: 0.25,
};

const HALF_LIFE_DAYS: Record<SignalSource, number> = {
  event: 30,
  linkedin: 90,
  company_site: 90,
  company: 90,
  github: 30,
  website: 30,
  website_metadata: 30,
  news: 14,
  username: 7,
  username_lookup: 7,
  email: 1,
  email_lookup: 1,
};

const TTL_SECONDS: Record<SignalSource, number> = {
  event: 30 * 24 * 3600,
  linkedin: 14 * 24 * 3600,
  company_site: 7 * 24 * 3600,
  company: 7 * 24 * 3600,
  github: 24 * 3600,
  website: 7 * 24 * 3600,
  website_metadata: 7 * 24 * 3600,
  news: 12 * 3600,
  username: 24 * 3600,
  username_lookup: 24 * 3600,
  email: 3600,
  email_lookup: 3600,
};

function confidenceBand(raw: number) {
  if (raw >= 0.8) return "high";
  if (raw >= 0.55) return "medium";
  return "low";
}

function freshnessScore(observedAt: string, halfLifeDays: number, now: Date) {
  const ageMs = Math.max(0, now.getTime() - new Date(observedAt).getTime());
  const ageDays = ageMs / (24 * 3600 * 1000);
  return Math.pow(0.5, ageDays / halfLifeDays);
}

function cacheKey(attendeeId: string, source: string, value: string) {
  return `${attendeeId}:${source}:${value}`.toLowerCase().replace(/[^a-z0-9:._-]/g, "-").slice(0, 220);
}

function signalKind(signal: PublicSignal): ConsolidatedPublicSignal["kind"] {
  if (signal.source === "github") return "technical";
  if (signal.source === "news") return "market";
  if (signal.source === "email") return "contact";
  if (signal.source === "company" || signal.source === "website") return "company";
  if (signal.source === "linkedin" || signal.source === "username") return "identity";
  return "metadata";
}

export function consolidatePublicSignals(enrichment: PersonEnrichment, now = new Date()): ConsolidatedPublicSignal[] {
  return enrichment.signals.map((signal, index) => {
    const source = signal.source as SignalSource;
    const halfLifeDays = HALF_LIFE_DAYS[source] ?? 30;
    const ttlSeconds = TTL_SECONDS[source] ?? 24 * 3600;
    const observedAt = enrichment.scannedAt;
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000).toISOString();
    const sensitive = source === "email" || source === "email_lookup" || source === "username" || source === "username_lookup";

    return {
      id: `${enrichment.attendeeId}:${source}:${index}`,
      attendeeId: enrichment.attendeeId,
      source,
      kind: signalKind(signal),
      label: signal.label,
      value: signal.value,
      url: signal.url,
      confidence: {
        raw: signal.confidence,
        band: confidenceBand(signal.confidence),
        reasons: [`${signal.label} from ${source}`],
      },
      sourceWeight: SOURCE_WEIGHTS[source] ?? 0.5,
      freshness: {
        observedAt,
        halfLifeDays,
        score: freshnessScore(observedAt, halfLifeDays, now),
      },
      consent: {
        required: sensitive,
        granted: !sensitive,
        lawfulBasis: sensitive ? "attendee_consent" : "public_profile",
        allowedForRecommendation: !sensitive,
        allowedForDisplay: !sensitive,
        retentionDays: sensitive ? 1 : 30,
      },
      cache: {
        cacheKey: cacheKey(enrichment.attendeeId, source, signal.value),
        ttlSeconds,
        expiresAt,
        revalidateAfter: expiresAt,
      },
    };
  });
}

export function consolidateRecommendation(
  match: MatchRecommendation,
  enrichment: PersonEnrichment,
  now = new Date()
): ConsolidatedRecommendation {
  const signals = consolidatePublicSignals(enrichment, now);
  const allowedSignals = signals.filter((signal) => signal.consent.allowedForRecommendation);
  const blockedSignalCount = signals.length - allowedSignals.length;
  const signalScore = allowedSignals.length
    ? allowedSignals.reduce((sum, signal) => sum + signal.confidence.raw * signal.sourceWeight * 100, 0) / allowedSignals.length
    : 0;
  const freshness = allowedSignals.length
    ? allowedSignals.reduce((sum, signal) => sum + signal.freshness.score * 100, 0) / allowedSignals.length
    : 0;
  const confidence = allowedSignals.length
    ? allowedSignals.reduce((sum, signal) => sum + signal.confidence.raw * 100, 0) / allowedSignals.length
    : 0;
  const final = Math.round(Math.min(100, Math.max(0, 0.7 * match.score + 0.2 * signalScore + 0.1 * freshness)));
  const topSignals = allowedSignals
    .sort((a, b) => b.confidence.raw * b.sourceWeight - a.confidence.raw * a.sourceWeight)
    .slice(0, 2);

  const explanations: RecommendationExplanation[] = [
    {
      rank: 1,
      reason: match.why[0] ?? "Strong event-goal fit.",
      contribution: match.score,
      signalIds: [`match:${match.attendeeId}:${match.targetId}`],
      sourceLabels: ["event intent"],
    },
  ];

  for (const [index, signal] of topSignals.entries()) {
    explanations.push({
      rank: index === 0 ? 2 : 3,
      reason: signal.value,
      contribution: Math.round(signal.confidence.raw * signal.sourceWeight * 100),
      signalIds: [signal.id],
      sourceLabels: [signal.label],
    });
  }

  return {
    attendeeId: match.attendeeId,
    targetId: match.targetId,
    scores: {
      baseMatch: match.score,
      publicSignal: Math.round(signalScore),
      freshness: Math.round(freshness),
      confidence: Math.round(confidence),
      final,
    },
    top3Explanation: explanations,
    consent: {
      displayLimited: blockedSignalCount > 0,
      blockedSignalCount,
      requiredActions: blockedSignalCount > 0 ? ["Collect attendee consent before using username or email lookup signals."] : [],
    },
    strategy: {
      opener: enrichment.strategy[0] ?? "Ask what they are hoping to get from the event.",
      angle: "market",
      talkingPoints: enrichment.strategy,
      avoidClaims: blockedSignalCount > 0 ? ["Do not mention account-existence or username lookup signals directly."] : [],
      generatedFromSignalIds: allowedSignals.slice(0, 3).map((signal) => signal.id),
    },
  };
}
