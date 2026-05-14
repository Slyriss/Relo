import { NextResponse } from "next/server";
import type { CrawledProfile } from "@/types";

// Mock profiles keyed by partial URL slug — extend as needed
const MOCK_PROFILES: Record<string, CrawledProfile> = {
  default: {
    company: "Acme Corp",
    title: "Product Manager",
    industry: "Technology",
    location: "San Francisco, CA",
    bio: "Product leader with 8+ years building 0→1 products at the intersection of AI and enterprise software. Passionate about developer experience and reducing time-to-value for complex workflows.",
    headline: "PM · AI Products",
    skills: ["Product Strategy", "AI/ML", "Go-to-Market", "Stakeholder Management"],
  },
  avachen: {
    company: "Northstar Ventures",
    title: "General Partner",
    industry: "Venture Capital",
    location: "San Francisco, CA",
    bio: "General Partner at Northstar Ventures, focused on early-stage AI and infrastructure startups. Former founder with two exits. Angel investor in 40+ companies across enterprise SaaS, developer tools, and climate tech.",
    headline: "GP @ Northstar Ventures · AI & Infrastructure",
    skills: ["Venture Capital", "Startup Investing", "Portfolio Management", "AI Strategy", "Board Governance"],
  },
  marcuslee: {
    company: "Stripe",
    title: "Engineering Manager",
    industry: "Fintech",
    location: "San Francisco, CA",
    bio: "Engineering leader at Stripe working on payments infrastructure. Previously led teams at Square and Plaid. Interested in hiring top infrastructure engineers and building fintech partnerships.",
    headline: "EM @ Stripe · Payments Infrastructure",
    skills: ["Engineering Leadership", "Distributed Systems", "Fintech", "Team Building"],
  },
  sarahpark: {
    company: "Sequoia Capital",
    title: "Principal",
    industry: "Venture Capital",
    location: "Menlo Park, CA",
    bio: "Principal at Sequoia Capital focused on B2B SaaS and developer infrastructure. Former operator at Salesforce and Twilio. I love meeting founders tackling hard technical problems.",
    headline: "Principal @ Sequoia · B2B SaaS",
    skills: ["Investment Analysis", "B2B SaaS", "Developer Tools", "Due Diligence"],
  },
};

function extractSlug(url: string): string {
  try {
    const clean = url.replace(/\/$/, "");
    const parts = clean.split("/");
    return parts[parts.length - 1].toLowerCase().replace(/[^a-z0-9]/g, "");
  } catch {
    return "";
  }
}

export async function POST(req: Request) {
  const { linkedinUrl } = await req.json();

  // Simulate network latency
  await new Promise((r) => setTimeout(r, 400));

  const slug = extractSlug(linkedinUrl ?? "");
  const profile: CrawledProfile = MOCK_PROFILES[slug] ?? MOCK_PROFILES.default;

  return NextResponse.json({ profile, source: "linkedin", scannedAt: new Date().toISOString() });
}
