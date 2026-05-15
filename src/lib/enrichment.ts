import type { Attendee, Goal, MatchRecommendation } from "@/types";

export type PublicSignal = {
  source: "linkedin" | "company" | "news" | "github" | "website" | "username" | "email" | "event";
  label: string;
  value: string;
  url?: string;
  confidence: number;
};

export type PersonEnrichment = {
  attendeeId: string;
  publicProfileUrl?: string;
  industry: string;
  likelyFocus: string;
  companyNews: string[];
  signals: PublicSignal[];
  strategy: string[];
  confidence: number;
  scannedAt: string;
};

export type EnrichedRecommendation = {
  attendee: Attendee;
  match: MatchRecommendation;
  enrichment: PersonEnrichment;
  priorityScore: number;
};

const INDUSTRY_FOCUS: Record<string, string> = {
  AI: "scaling infrastructure, model operations, and enterprise adoption",
  Venture: "finding high-signal founders and market theses before they become obvious",
  People: "hiring systems, retention, and distributed-team operating models",
  SaaS: "finding design partners, channel leverage, and repeatable GTM motion",
  Fintech: "risk, payments infrastructure, compliance, and finance automation",
  "Developer Tools": "developer adoption, community-led growth, and platform reliability",
  Healthtech: "clinical workflow efficiency and adoption inside regulated teams",
  GTM: "pipeline quality, sales motion, lifecycle conversion, and founder-led sales",
  Marketplace: "liquidity, operational leverage, and trust in two-sided networks",
  Impact: "operator networks, program design, and measurable outcomes",
  Legal: "financing readiness, commercial contracting, and founder risk reduction",
  Security: "buyer trust, risk posture, and security-led enterprise readiness",
  Climate: "field operations, capital efficiency, and hardware/software deployment",
  Community: "high-trust member engagement and relationship design",
};

const GOAL_STRATEGY: Record<Goal, string> = {
  fundraising: "Open with traction, timing, and why this event is the right room for your next raise.",
  hiring: "Ask about team shape, hiring bottlenecks, and what excellent candidates are optimizing for.",
  partnerships: "Look for shared customers, distribution overlap, or one concrete co-marketing experiment.",
  customers: "Lead with the painful workflow you solve, then ask how they currently handle it.",
  learning: "Use a crisp question about their current operating lesson, then trade one of your own.",
};

function inferProfileUrl(attendee: Attendee) {
  if (attendee.linkedinUrl) return attendee.linkedinUrl;
  return undefined;
}

export function enrichAttendee(attendee: Attendee, now = new Date()): PersonEnrichment {
  const industry = attendee.industry ?? "Technology";
  const likelyFocus = INDUSTRY_FOCUS[industry] ?? "relationship building, market insight, and practical collaboration";
  const profileUrl = inferProfileUrl(attendee);
  const companyNews: string[] = [];
  const signals: PublicSignal[] = [];

  if (profileUrl) {
    signals.push(
    {
      source: "linkedin",
      label: "Submitted public profile",
      value: `${attendee.name} at ${attendee.company}`,
      url: profileUrl,
      confidence: 0.92,
    });
  } else {
    signals.push({
      source: "linkedin",
      label: "LinkedIn not verified",
      value: "No submitted or resolved LinkedIn profile URL. Relo will not substitute a search-results URL as a profile.",
      confidence: 0.2,
    });
  }

  signals.push(
    {
      source: "company",
      label: "Company context",
      value: `${attendee.company} operates in ${industry}`,
      confidence: attendee.industry ? 0.85 : 0.55,
    },
    {
      source: "event",
      label: "Event intent",
      value: attendee.goals.map((goal) => GOAL_STRATEGY[goal]).join(" "),
      confidence: 0.9,
    },
  );

  return {
    attendeeId: attendee.id,
    publicProfileUrl: profileUrl,
    industry,
    likelyFocus,
    companyNews,
    signals,
    strategy: [
      `Start with ${industry}: ask what they are trying to learn or unlock at this event.`,
      `Connect your ask to ${attendee.company}'s likely focus on ${likelyFocus}.`,
      GOAL_STRATEGY[attendee.goals[0] ?? "learning"],
    ],
    confidence: Math.round((signals.reduce((sum, signal) => sum + signal.confidence, 0) / signals.length) * 100) / 100,
    scannedAt: now.toISOString(),
  };
}

export function rankEnrichedRecommendations(
  attendees: Attendee[],
  recommendations: MatchRecommendation[],
  limit = 3
): EnrichedRecommendation[] {
  return recommendations
    .map((match) => {
      const attendee = attendees.find((item) => item.id === match.targetId);
      if (!attendee) return null;
      const enrichment = enrichAttendee(attendee);
      const signalScore = Math.round(enrichment.confidence * 10);
      const priorityScore = match.score + signalScore + Math.min(attendee.goals.length * 2, 6);
      return { attendee, match, enrichment, priorityScore };
    })
    .filter((item): item is EnrichedRecommendation => Boolean(item))
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, limit);
}
