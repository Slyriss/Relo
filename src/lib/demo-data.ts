import type { Attendee, CheckIn, Event, Meeting, MeetingRequest, Organization, User } from "@/types";

export const demoUser: User = {
  id: "user-ava",
  email: "ava@northstar.vc",
  name: "Ava Chen",
  role: "organizer",
  company: "Northstar Ventures",
  title: "General Partner",
  linkedinUrl: "https://linkedin.com/in/avachen",
  bio: "General Partner at Northstar Ventures, focused on early-stage AI and infrastructure startups. Former founder with two exits. Angel investor in 40+ companies across enterprise SaaS, developer tools, and climate tech.",
  headline: "GP @ Northstar Ventures · AI & Infrastructure",
  industry: "Venture Capital",
  location: "San Francisco, CA",
  skills: ["Venture Capital", "Startup Investing", "Portfolio Management", "AI Strategy", "Board Governance"],
  photoUrl: "https://i.pravatar.cc/160?u=ava-northstar-vc",
  visibility: {
    email: false,
    company: true,
    title: true,
    linkedinUrl: false,
    bio: true,
    headline: true,
    goals: true,
    industry: true,
    location: true,
  },
  crawlStatus: "found",
  crawledAt: "2026-06-10T10:00:00.000Z",
};

export const demoOrg: Organization = {
  id: "org-northstar",
  name: "Northstar Ventures",
  slug: "northstar",
  ownerId: demoUser.id
};

export const demoEvent: Event = {
  id: "relo-summit-2026",
  organizationId: demoOrg.id,
  slug: "relo-summit-2026",
  title: "Relo Summit 2026",
  description: "A private relationship-first summit for founders, operators, investors, and GTM leaders.",
  venue: "The Pearl, San Francisco",
  startsAt: "2026-06-12T09:00:00.000Z",
  endsAt: "2026-06-12T18:00:00.000Z",
  status: "published"
};

export const demoAttendees: Attendee[] = [
  ["att-1", "Maya Patel", "maya@orbit.ai", "Orbit AI", "Founder & CEO", "AI infrastructure founder raising Series A", ["fundraising", "customers"], "AI", 5],
  ["att-2", "Jon Bell", "jon@forge.capital", "Forge Capital", "Partner", "Early-stage investor focused on developer tools and AI", ["learning", "partnerships"], "Venture", 6],
  ["att-3", "Elena Ruiz", "elena@brightops.com", "BrightOps", "VP People", "Scaling hiring systems for distributed teams", ["hiring", "learning"], "People", 4],
  ["att-4", "Sam Kim", "sam@northwind.co", "Northwind", "Head of Partnerships", "Builds ecosystem programs for B2B SaaS", ["partnerships", "customers"], "SaaS", 4],
  ["att-5", "Nora Stein", "nora@ledgerflow.com", "LedgerFlow", "CFO", "Finance operator for usage-based software companies", ["learning", "partnerships"], "Fintech", 5],
  ["att-6", "Theo Brooks", "theo@kindred.dev", "Kindred", "Developer Advocate", "Community builder across open source data tooling", ["partnerships", "learning"], "Developer Tools", 3],
  ["att-7", "Iris Wang", "iris@apollohealth.io", "Apollo Health", "Product Lead", "Clinical workflow product leader", ["customers", "learning"], "Healthtech", 4],
  ["att-8", "Leo Martin", "leo@atlaslabs.com", "Atlas Labs", "Founder", "Building procurement automation for mid-market teams", ["fundraising", "customers"], "SaaS", 4],
  ["att-9", "Priya Nair", "priya@signal.co", "Signal", "Revenue Advisor", "Advises founders on founder-led sales to repeatable GTM", ["customers", "learning"], "GTM", 5],
  ["att-10", "Owen Clark", "owen@citygrid.io", "CityGrid", "COO", "Operations leader focused on marketplace liquidity", ["hiring", "partnerships"], "Marketplace", 5],
  ["att-11", "Grace Liu", "grace@meshdata.com", "Mesh Data", "Data Scientist", "Applies graph learning to customer intelligence", ["learning", "hiring"], "AI", 3],
  ["att-12", "Marcus Green", "marcus@rippleworks.org", "RippleWorks", "Program Director", "Connects operators with high-impact entrepreneurs", ["partnerships", "learning"], "Impact", 5],
  ["att-13", "Zara Haddad", "zara@nomadpay.com", "NomadPay", "Founder", "Cross-border payroll founder looking for design partners", ["fundraising", "customers"], "Fintech", 4],
  ["att-14", "Ben Foster", "ben@launchlegal.com", "Launch Legal", "Startup Counsel", "Helps founders with financings and commercial contracts", ["customers", "partnerships"], "Legal", 5],
  ["att-15", "Ari Cole", "ari@cloudlane.dev", "Cloudlane", "Engineering Manager", "Leads platform teams and evaluates infrastructure vendors", ["hiring", "customers"], "Developer Tools", 4],
  ["att-16", "Keiko Tan", "keiko@sakura.vc", "Sakura Ventures", "Principal", "Invests in applied AI and vertical SaaS", ["learning", "partnerships"], "Venture", 5],
  ["att-17", "Luis Moreno", "luis@cobaltlabs.io", "Cobalt Labs", "Security Lead", "Security buyer and advisor for fast-growing startups", ["customers", "learning"], "Security", 4],
  ["att-18", "Hannah Price", "hannah@fieldkit.co", "FieldKit", "Founder", "Hardware-enabled field operations platform", ["fundraising", "hiring"], "Climate", 4],
  ["att-19", "Talia Rosen", "talia@northstar.vc", "Northstar Ventures", "Community Lead", "Designs high-trust founder communities", ["partnerships", "learning"], "Community", 4],
  ["att-20", "Chris Yu", "chris@marketbeam.com", "MarketBeam", "Growth Lead", "Runs lifecycle and PLG experiments for B2B products", ["customers", "hiring"], "GTM", 4]
].map(([id, name, email, company, title, bio, goals, industry, seniority]) => ({
  id: id as string,
  eventId: demoEvent.id,
  name: name as string,
  email: email as string,
  company: company as string,
  title: title as string,
  linkedinUrl: `https://linkedin.com/in/${(name as string).toLowerCase().replaceAll(" ", "-")}`,
  bio: bio as string,
  headline: bio as string,
  goals: goals as Attendee["goals"],
  industry: industry as string,
  seniority: seniority as number,
  profileComplete: Number(seniority) >= 4,
  photoUrl: `https://i.pravatar.cc/160?u=${encodeURIComponent(email as string)}`
}));

export const demoMeetings: Meeting[] = [
  {
    id: "meet-1",
    eventId: demoEvent.id,
    attendeeAId: "att-1",
    attendeeBId: "att-2",
    note: "Maya is raising in Q3. Jon asked for a deeper infra metrics deck.",
    topic: "Series A readiness and infra benchmarks",
    promisedAction: "Send Jon a metrics deck and customer evidence summary.",
    owner: "me",
    dueDate: "2026-06-14",
    followupChannel: "email",
    permissionToContact: true,
    createdAt: "2026-06-12T17:15:00.000Z",
    synced: true
  },
  {
    id: "meet-2",
    eventId: demoEvent.id,
    attendeeAId: "att-8",
    attendeeBId: "att-9",
    note: "Priya offered to introduce Leo to three procurement design partners.",
    topic: "Procurement design partner intros",
    promisedAction: "Priya will share three buyer intros after Leo sends the target persona.",
    owner: "both",
    dueDate: "2026-06-15",
    followupChannel: "linkedin",
    permissionToContact: true,
    createdAt: "2026-06-12T18:05:00.000Z",
    synced: true
  },
  {
    id: "meet-3",
    eventId: demoEvent.id,
    attendeeAId: "att-13",
    attendeeBId: "att-14",
    note: "Zara needs help reviewing payroll compliance templates.",
    topic: "Payroll compliance review",
    promisedAction: "Ben will review the template pack before Zara's pilot launch.",
    owner: "them",
    dueDate: "2026-06-18",
    followupChannel: "email",
    permissionToContact: true,
    createdAt: "2026-06-12T19:10:00.000Z",
    synced: true
  }
];

// ─── Past events ──────────────────────────────────────────────────────────────

export const pastEvent1: Event = {
  id: "bay-area-founders-forum-2025",
  organizationId: demoOrg.id,
  slug: "bay-area-founders-forum-2025",
  title: "Bay Area Founders Forum",
  description: "A curated gathering for early and growth-stage founders building in AI, SaaS, and climate.",
  venue: "Dogpatch Labs, San Francisco",
  startsAt: "2025-10-14T09:00:00.000Z",
  endsAt: "2025-10-14T18:00:00.000Z",
  status: "published"
};

export const pastEvent2: Event = {
  id: "west-coast-operators-summit-2025",
  organizationId: demoOrg.id,
  slug: "west-coast-operators-summit-2025",
  title: "West Coast Operators Summit",
  description: "Invite-only summit for senior operators: hiring leaders, finance execs, and GTM builders.",
  venue: "Cavallo Point, Sausalito",
  startsAt: "2025-12-09T09:00:00.000Z",
  endsAt: "2025-12-09T18:00:00.000Z",
  status: "published"
};

// Attendees for past events — same people as current event (matched by email), new IDs per event.
// Email is the cross-event identity key.
function pastAttendee(
  id: string,
  eventId: string,
  [, name, email, company, title, bio, goals, industry, seniority]: readonly [string, string, string, string, string, string, readonly string[], string, number]
): Attendee {
  return {
    id,
    eventId,
    name,
    email,
    company,
    title,
    linkedinUrl: `https://linkedin.com/in/${name.toLowerCase().replaceAll(" ", "-")}`,
    bio,
    headline: bio,
    goals: goals as Attendee["goals"],
    industry,
    seniority,
    profileComplete: seniority >= 4,
    photoUrl: `https://i.pravatar.cc/160?u=${encodeURIComponent(email)}`
  };
}

// Tuples reused from the current event for consistency
const MAYA   = ["att-1",  "Maya Patel",   "maya@orbit.ai",       "Orbit AI",       "Founder & CEO",        "AI infrastructure founder raising Series A",                  ["fundraising", "customers"], "AI",             5] as const;
const JON    = ["att-2",  "Jon Bell",     "jon@forge.capital",   "Forge Capital",  "Partner",              "Early-stage investor focused on developer tools and AI",       ["learning", "partnerships"], "Venture",        6] as const;
const ELENA  = ["att-3",  "Elena Ruiz",   "elena@brightops.com", "BrightOps",      "VP People",            "Scaling hiring systems for distributed teams",                  ["hiring", "learning"],       "People",         4] as const;
const SAM    = ["att-4",  "Sam Kim",      "sam@northwind.co",    "Northwind",      "Head of Partnerships", "Builds ecosystem programs for B2B SaaS",                       ["partnerships", "customers"],"SaaS",           4] as const;
const NORA   = ["att-5",  "Nora Stein",   "nora@ledgerflow.com", "LedgerFlow",     "CFO",                  "Finance operator for usage-based software companies",           ["learning", "partnerships"], "Fintech",        5] as const;
const LEO    = ["att-8",  "Leo Martin",   "leo@atlaslabs.com",   "Atlas Labs",     "Founder",              "Building procurement automation for mid-market teams",          ["fundraising", "customers"], "SaaS",           4] as const;
const PRIYA  = ["att-9",  "Priya Nair",   "priya@signal.co",     "Signal",         "Revenue Advisor",      "Advises founders on founder-led sales to repeatable GTM",       ["customers", "learning"],    "GTM",            5] as const;
const MARCUS = ["att-12", "Marcus Green", "marcus@rippleworks.org","RippleWorks",   "Program Director",     "Connects operators with high-impact entrepreneurs",             ["partnerships", "learning"], "Impact",         5] as const;
const KEIKO  = ["att-16", "Keiko Tan",    "keiko@sakura.vc",     "Sakura Ventures","Principal",            "Invests in applied AI and vertical SaaS",                       ["learning", "partnerships"], "Venture",        5] as const;

export const pastAttendees1: Attendee[] = [
  pastAttendee("p1-maya",  pastEvent1.id, MAYA),
  pastAttendee("p1-jon",   pastEvent1.id, JON),
  pastAttendee("p1-sam",   pastEvent1.id, SAM),
  pastAttendee("p1-leo",   pastEvent1.id, LEO),
  pastAttendee("p1-priya", pastEvent1.id, PRIYA),
  pastAttendee("p1-keiko", pastEvent1.id, KEIKO)
];

export const pastAttendees2: Attendee[] = [
  pastAttendee("p2-maya",   pastEvent2.id, MAYA),
  pastAttendee("p2-jon",    pastEvent2.id, JON),
  pastAttendee("p2-elena",  pastEvent2.id, ELENA),
  pastAttendee("p2-nora",   pastEvent2.id, NORA),
  pastAttendee("p2-marcus", pastEvent2.id, MARCUS)
];

export const pastMeetings: Meeting[] = [
  {
    id: "pm-1",
    eventId: pastEvent1.id,
    attendeeAId: "p1-maya",
    attendeeBId: "p1-jon",
    note: "Discussed Series A timeline and AI infrastructure benchmarks. Jon wants a deck by November.",
    createdAt: "2025-10-14T15:30:00.000Z",
    synced: true
  },
  {
    id: "pm-2",
    eventId: pastEvent1.id,
    attendeeAId: "p1-maya",
    attendeeBId: "p1-priya",
    note: "Priya walked me through founder-led sales motion. Will implement her pipeline framework.",
    createdAt: "2025-10-14T17:00:00.000Z",
    synced: true
  },
  {
    id: "pm-3",
    eventId: pastEvent2.id,
    attendeeAId: "p2-maya",
    attendeeBId: "p2-elena",
    note: "Elena intro'd me to two design partners for Orbit's HR analytics module.",
    createdAt: "2025-12-09T14:45:00.000Z",
    synced: true
  }
];

// Attendees checked in live at the current event (Jon, Sam, Priya, Iris)
export const demoCheckIns: CheckIn[] = [
  { id: "ci-1", eventId: demoEvent.id, attendeeId: "att-2",  checkedInAt: "2026-06-12T09:12:00.000Z" },
  { id: "ci-2", eventId: demoEvent.id, attendeeId: "att-4",  checkedInAt: "2026-06-12T09:31:00.000Z" },
  { id: "ci-3", eventId: demoEvent.id, attendeeId: "att-9",  checkedInAt: "2026-06-12T09:45:00.000Z" },
  { id: "ci-4", eventId: demoEvent.id, attendeeId: "att-7",  checkedInAt: "2026-06-12T09:58:00.000Z" },
  { id: "ci-5", eventId: demoEvent.id, attendeeId: "att-16", checkedInAt: "2026-06-12T10:05:00.000Z" },
];

// Pre-event meeting requests made by Maya (att-1)
export const demoMeetingRequests: MeetingRequest[] = [
  {
    id: "req-1", eventId: demoEvent.id, requesterId: "att-1", targetId: "att-16",
    note: "Would love to explore Series A co-investment opportunities.",
    createdAt: "2026-06-10T11:00:00.000Z", status: "pending"
  },
  {
    id: "req-2", eventId: demoEvent.id, requesterId: "att-1", targetId: "att-6",
    note: "Interested in open-source data tooling for Orbit's pipeline.",
    createdAt: "2026-06-10T11:30:00.000Z", status: "pending"
  },
  {
    id: "req-3", eventId: demoEvent.id, requesterId: "att-8", targetId: "att-4",
    note: "Leo wants to explore partnership distribution for Atlas.",
    createdAt: "2026-06-11T09:00:00.000Z", status: "pending"
  },
  {
    id: "req-4", eventId: demoEvent.id, requesterId: "att-13", targetId: "att-2",
    note: "Zara looking for a VC intro from Forge Capital.",
    createdAt: "2026-06-11T14:00:00.000Z", status: "facilitated"
  },
  // Incoming pokes TO Maya (att-1) from other attendees
  {
    id: "req-5", eventId: demoEvent.id, requesterId: "att-9", targetId: "att-1",
    note: "Saw you're raising Series A — happy to share what worked at Signal. Would love to compare notes.",
    createdAt: "2026-06-11T10:15:00.000Z", status: "pending"
  },
  {
    id: "req-6", eventId: demoEvent.id, requesterId: "att-16", targetId: "att-1",
    note: "Orbit AI is on my radar. Would love 20 mins on your infra stack and traction.",
    createdAt: "2026-06-11T16:40:00.000Z", status: "pending"
  },
  {
    id: "req-7", eventId: demoEvent.id, requesterId: "att-18", targetId: "att-1",
    note: "Exploring AI for field ops — keen to learn how Orbit approaches pipeline intelligence.",
    createdAt: "2026-06-12T08:30:00.000Z", status: "pending"
  },
];
