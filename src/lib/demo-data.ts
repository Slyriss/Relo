import type { Attendee, Event, Meeting, Organization, User } from "@/types";

export const demoUser: User = {
  id: "user-ava",
  email: "ava@northstar.vc",
  name: "Ava Chen",
  role: "organizer"
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
  profileComplete: Number(seniority) >= 4
}));

export const demoMeetings: Meeting[] = [
  {
    id: "meet-1",
    eventId: demoEvent.id,
    attendeeAId: "att-1",
    attendeeBId: "att-2",
    note: "Maya is raising in Q3. Jon asked for a deeper infra metrics deck.",
    createdAt: "2026-06-12T17:15:00.000Z",
    synced: true
  },
  {
    id: "meet-2",
    eventId: demoEvent.id,
    attendeeAId: "att-8",
    attendeeBId: "att-9",
    note: "Priya offered to introduce Leo to three procurement design partners.",
    createdAt: "2026-06-12T18:05:00.000Z",
    synced: true
  },
  {
    id: "meet-3",
    eventId: demoEvent.id,
    attendeeAId: "att-13",
    attendeeBId: "att-14",
    note: "Zara needs help reviewing payroll compliance templates.",
    createdAt: "2026-06-12T19:10:00.000Z",
    synced: true
  }
];
