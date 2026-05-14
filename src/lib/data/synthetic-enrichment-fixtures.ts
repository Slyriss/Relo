import type { Attendee, Goal } from "@/types";

export type SyntheticEnrichmentSubject = {
  id: string;
  name: string;
  email: string;
  company: string;
  title: string;
  publicProfileUrl: string;
  photoUrl: string;
  photoConsent: {
    granted: true;
    grantedAt: string;
    scope: "enrichment-evaluation";
    source: "synthetic-generated-avatar";
  };
  enrichmentConsent: {
    granted: true;
    grantedAt: string;
    allowedUses: Array<"profile_lookup" | "company_context" | "public_profile_summary" | "photo_display">;
  };
  industry: string;
  location: string;
  goals: Goal[];
  bio: string;
  expectedSignals: string[];
  notes: string;
};

const CONSENT_GRANTED_AT = "2026-05-14T00:00:00.000Z";

export const syntheticEnrichmentSubjects: SyntheticEnrichmentSubject[] = [
  {
    id: "synthetic-enrich-001",
    name: "Alex Rivera",
    email: "alex.rivera@example.com",
    company: "Northstar Demo Labs",
    title: "Founder",
    publicProfileUrl: "https://profiles.example.test/alex-rivera",
    photoUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Alex%20Rivera",
    photoConsent: {
      granted: true,
      grantedAt: CONSENT_GRANTED_AT,
      scope: "enrichment-evaluation",
      source: "synthetic-generated-avatar",
    },
    enrichmentConsent: {
      granted: true,
      grantedAt: CONSENT_GRANTED_AT,
      allowedUses: ["profile_lookup", "company_context", "public_profile_summary", "photo_display"],
    },
    industry: "AI",
    location: "San Francisco, CA",
    goals: ["fundraising", "customers"],
    bio: "Synthetic founder profile for evaluating AI infrastructure enrichment, customer-fit signals, and investor conversation openers.",
    expectedSignals: ["founder", "AI infrastructure", "fundraising", "customer discovery"],
    notes: "Safe synthetic profile. Do not use as evidence of a real person or company.",
  },
  {
    id: "synthetic-enrich-002",
    name: "Mina Shah",
    email: "mina.shah@example.org",
    company: "CivicFlow Sandbox",
    title: "Head of Partnerships",
    publicProfileUrl: "https://profiles.example.test/mina-shah",
    photoUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Mina%20Shah",
    photoConsent: {
      granted: true,
      grantedAt: CONSENT_GRANTED_AT,
      scope: "enrichment-evaluation",
      source: "synthetic-generated-avatar",
    },
    enrichmentConsent: {
      granted: true,
      grantedAt: CONSENT_GRANTED_AT,
      allowedUses: ["profile_lookup", "company_context", "public_profile_summary", "photo_display"],
    },
    industry: "Impact",
    location: "Austin, TX",
    goals: ["partnerships", "learning"],
    bio: "Synthetic partnerships operator testing public-profile summaries, civic technology context, and collaboration recommendations.",
    expectedSignals: ["partnerships", "civic technology", "operator", "ecosystem"],
    notes: "Uses reserved domains and a generated avatar URL only.",
  },
  {
    id: "synthetic-enrich-003",
    name: "Jordan Lee",
    email: "jordan.lee@example.net",
    company: "LedgerKit Test Co",
    title: "Finance Lead",
    publicProfileUrl: "https://profiles.example.test/jordan-lee",
    photoUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Jordan%20Lee",
    photoConsent: {
      granted: true,
      grantedAt: CONSENT_GRANTED_AT,
      scope: "enrichment-evaluation",
      source: "synthetic-generated-avatar",
    },
    enrichmentConsent: {
      granted: true,
      grantedAt: CONSENT_GRANTED_AT,
      allowedUses: ["profile_lookup", "company_context", "public_profile_summary", "photo_display"],
    },
    industry: "Fintech",
    location: "New York, NY",
    goals: ["customers", "learning"],
    bio: "Synthetic finance profile for testing enrichment around compliance, buyer pain, and peer-learning recommendations.",
    expectedSignals: ["fintech", "finance operations", "compliance", "buyer workflow"],
    notes: "Contains no live credentials, private URLs, or real profile references.",
  },
  {
    id: "synthetic-enrich-004",
    name: "Taylor Morgan",
    email: "taylor.morgan@example.com",
    company: "HireLoop Fixture Group",
    title: "VP People",
    publicProfileUrl: "https://profiles.example.test/taylor-morgan",
    photoUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Taylor%20Morgan",
    photoConsent: {
      granted: true,
      grantedAt: CONSENT_GRANTED_AT,
      scope: "enrichment-evaluation",
      source: "synthetic-generated-avatar",
    },
    enrichmentConsent: {
      granted: true,
      grantedAt: CONSENT_GRANTED_AT,
      allowedUses: ["profile_lookup", "company_context", "public_profile_summary", "photo_display"],
    },
    industry: "People",
    location: "Denver, CO",
    goals: ["hiring", "partnerships"],
    bio: "Synthetic people-leadership profile for evaluating hiring-signal extraction and warm intro recommendations.",
    expectedSignals: ["hiring", "people operations", "talent pipeline", "leadership"],
    notes: "Intended for safe local tests and demos only.",
  },
  {
    id: "synthetic-enrich-005",
    name: "Sam Carter",
    email: "sam.carter@example.org",
    company: "ClimateOps Example",
    title: "Product Manager",
    publicProfileUrl: "https://profiles.example.test/sam-carter",
    photoUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Sam%20Carter",
    photoConsent: {
      granted: true,
      grantedAt: CONSENT_GRANTED_AT,
      scope: "enrichment-evaluation",
      source: "synthetic-generated-avatar",
    },
    enrichmentConsent: {
      granted: true,
      grantedAt: CONSENT_GRANTED_AT,
      allowedUses: ["profile_lookup", "company_context", "public_profile_summary", "photo_display"],
    },
    industry: "Climate",
    location: "Seattle, WA",
    goals: ["customers", "partnerships"],
    bio: "Synthetic climate product profile for testing market-context enrichment and design-partner recommendations.",
    expectedSignals: ["climate", "product", "design partners", "field operations"],
    notes: "Photo URL is a generated avatar, not a scraped real-person image.",
  },
];

export const syntheticEnrichmentAttendees: Attendee[] = syntheticEnrichmentSubjects.map((subject) => ({
  id: subject.id,
  eventId: "synthetic-enrichment-eval",
  name: subject.name,
  email: subject.email,
  company: subject.company,
  title: subject.title,
  linkedinUrl: subject.publicProfileUrl,
  bio: subject.bio,
  headline: `${subject.title} at ${subject.company}`,
  goals: subject.goals,
  industry: subject.industry,
  seniority: 4,
  profileComplete: true,
  photoUrl: subject.photoUrl,
}));
