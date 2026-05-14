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

const COMPANY_NEWS: Record<string, string[]> = {
  "Orbit AI": ["AI infrastructure buyers are consolidating around fewer, more trusted workflow vendors."],
  "Forge Capital": ["Developer tooling and applied AI remain active early-stage investment themes."],
  BrightOps: ["People teams are rebuilding hiring loops around efficiency, retention, and manager quality."],
  Northwind: ["SaaS partnership teams are shifting from broad ecosystem programs to measurable co-sell plays."],
  LedgerFlow: ["Finance teams are watching usage-based pricing, cash discipline, and automation in close detail."],
  Kindred: ["Open-source communities are becoming stronger distribution channels for data and developer tooling."],
  "Apollo Health": ["Clinical workflow teams are prioritizing measurable time savings over broad AI experimentation."],
  "Atlas Labs": ["Procurement automation is moving toward faster vendor evaluation and tighter spend visibility."],
  Signal: ["B2B teams are revisiting founder-led sales, lifecycle motion, and pipeline quality."],
  CityGrid: ["Marketplace operators are focused on liquidity, unit economics, and trust signals."],
  "Mesh Data": ["Graph and customer-intelligence teams are using relationship context to improve prioritization."],
  RippleWorks: ["Operator networks are increasingly used to transfer practical playbooks across impact teams."],
  NomadPay: ["Cross-border payroll teams are watching compliance, payments reliability, and global hiring."],
  "Launch Legal": ["Founders are prioritizing financing readiness, commercial contracts, and AI policy risk."],
  Cloudlane: ["Platform teams are consolidating infrastructure tools and scrutinizing vendor reliability."],
  "Sakura Ventures": ["Applied AI and vertical SaaS remain strong thesis areas for early-stage investors."],
  "Cobalt Labs": ["Security buyers are focused on practical risk reduction and vendor trust."],
  FieldKit: ["Climate and field-ops teams are pairing hardware data with automation to improve deployment speed."],
  "Northstar Ventures": ["Founder communities are moving toward curated, high-trust relationship design."],
  MarketBeam: ["Growth teams are prioritizing lifecycle experiments and higher-quality PLG conversion."],
};

function inferProfileUrl(attendee: Attendee) {
  if (attendee.linkedinUrl) return attendee.linkedinUrl;
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${attendee.name} ${attendee.company}`)}`;
}

export function enrichAttendee(attendee: Attendee, now = new Date()): PersonEnrichment {
  const industry = attendee.industry ?? "Technology";
  const likelyFocus = INDUSTRY_FOCUS[industry] ?? "relationship building, market insight, and practical collaboration";
  const profileUrl = inferProfileUrl(attendee);
  const companyNews = COMPANY_NEWS[attendee.company] ?? [
    `${attendee.company} is likely watching efficiency, customer quality, and partnership leverage in the current market.`,
  ];
  const signals: PublicSignal[] = [
    {
      source: "linkedin",
      label: attendee.linkedinUrl ? "Public profile" : "Profile search",
      value: `${attendee.name} at ${attendee.company}`,
      url: profileUrl,
      confidence: attendee.linkedinUrl ? 0.92 : 0.62,
    },
    {
      source: "company",
      label: "Company context",
      value: `${attendee.company} operates in ${industry}`,
      confidence: attendee.industry ? 0.85 : 0.55,
    },
    {
      source: "news",
      label: "Market signal",
      value: companyNews[0],
      confidence: 0.68,
    },
    {
      source: "event",
      label: "Event intent",
      value: attendee.goals.map((goal) => GOAL_STRATEGY[goal]).join(" "),
      confidence: 0.9,
    },
  ];

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
