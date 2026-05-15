import { NextResponse } from "next/server";
import { z } from "zod";
import { attendeePayloadSchema } from "@/lib/ai/schemas";
import { guardPost, readJsonBody, RequestBodyError } from "@/lib/api/security";
import { aiProvider, type ConnectionPlan, type ResearchBrief } from "@/lib/ai/provider";
import { scanAttendeeEnrichment } from "@/lib/data/enrichment";
import { fetchRecentNews } from "@/lib/news";
import { discoverPublicSources, type ResearchSource } from "@/lib/research";

export const dynamic = "force-dynamic";

const viewerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(160),
  company: z.string().trim().min(1).max(160),
  goal: z.string().trim().min(1).max(300),
  offer: z.string().trim().min(1).max(300),
  background: z.string().trim().max(500).optional(),
});

const lookupSchema = z.object({
  attendee: attendeePayloadSchema,
  context: z.string().trim().max(500).optional(),
  researchQuestion: z.string().trim().max(500).optional(),
  sharedContext: z.string().trim().max(500).optional(),
  viewer: viewerSchema.optional(),
  persist: z.boolean().default(false),
});

function buildConnectionPlan({
  viewer,
  attendee,
  context,
  topNewsTitle,
}: {
  viewer?: z.infer<typeof viewerSchema>;
  attendee: z.infer<typeof attendeePayloadSchema>;
  context?: string;
  topNewsTitle?: string;
}): ConnectionPlan | null {
  if (!viewer) return null;

  const targetRole = [attendee.title, attendee.company].filter(Boolean).join(" at ") || attendee.name;
  const industry = attendee.industry ?? "their market";
  const contextLine = context ? ` at ${context}` : "";
  const newsLine = topNewsTitle ? ` A timely hook is the recent coverage: "${topNewsTitle}".` : "";
  const viewerGoal = viewer.goal.toLowerCase();
  const eventContext = context?.toLowerCase() ?? "";
  const isHiring = viewerGoal.includes("hir") || viewerGoal.includes("recruit");
  const isInvestor = viewerGoal.includes("invest") || viewerGoal.includes("deal");
  const isLearning = viewerGoal.includes("learn") || viewerGoal.includes("mentor") || eventContext.includes("school");
  const isSales = viewerGoal.includes("customer") || viewerGoal.includes("sales") || viewerGoal.includes("pilot");
  const opportunity = isHiring
    ? "talent or advisor fit"
    : isInvestor
      ? "market insight and potential deal flow"
      : isLearning
        ? "practical learning, mentorship, and shared context"
        : isSales
          ? "customer discovery or a small pilot"
          : "a useful collaboration path";
  const relationshipAction = isHiring
    ? "understand their career direction, current team needs, and whether there is a useful intro to make"
    : isInvestor
      ? "understand what they are building, what market signal they see, and who else in the room they respect"
      : isLearning
        ? "learn what they have tried, what surprised them, and whether there is a shared school or community bridge"
        : isSales
          ? "test whether the problem is painful enough for a pilot or customer conversation"
          : "find one concrete next step that is useful to both sides";

  return {
    headline: `${viewer.name} should talk to ${attendee.name} because ${targetRole} could help with ${opportunity}${contextLine}.`,
    whyMeet: `${attendee.name} sits close to ${industry}, which matters because ${viewer.name}'s current goal is: ${viewer.goal}.`,
    personalBridge: `Start with the most human overlap you know: ${viewer.background || viewer.title}. If there is a shared school, city, event track, community, or career stage, use that before explaining what ${viewer.company} does.`,
    partnership: `${viewer.company} should frame the opportunity as ${opportunity}: ${relationshipAction}.`,
    ask: `Ask what brought ${attendee.name} to this event and what they are hoping to leave with, then connect the answer to ${viewer.goal}.`,
    offer: `Offer ${viewer.offer}, framed as a small test rather than a broad platform pitch.`,
    nextStep: `If there is interest, propose one lightweight follow-up that matches the event context and does not require a big commitment.${newsLine}`,
    risk: `Do not force a founder or sales frame if the event is about learning, hiring, investing, or community. Lead with the user's actual reason for being in the room.`,
  };
}

function buildResearchFallback({
  attendee,
  context,
  question,
  sources,
  newsTitles,
}: {
  attendee: z.infer<typeof attendeePayloadSchema>;
  context?: string;
  question?: string;
  sources: ResearchSource[];
  newsTitles: string[];
}): ResearchBrief {
  const linkedInSource = sources.find((source) => source.type === "linkedin" && source.verified);
  const webSourceCount = sources.filter((source) => source.type === "web").length;
  const newsCount = newsTitles.length;
  const role = [attendee.title, attendee.company].filter(Boolean).join(" at ") || attendee.name;

  return {
    summary: `${attendee.name} is being researched as ${role}${context ? ` for ${context}` : ""}. ${
      linkedInSource
        ? "A LinkedIn profile URL is available in the source set."
        : "No verified LinkedIn profile URL is available yet."
    } The brief below is limited to submitted profile fields and live sources returned by the configured source providers.`,
    findings: [
      `${attendee.name}'s submitted profile places them around ${attendee.industry ?? "the stated market"} and ${attendee.company || "their organization"}.`,
      newsCount
        ? `${newsCount} recent public article${newsCount === 1 ? "" : "s"} were returned for the target/company/context query.`
        : "No recent public articles were returned by the configured news source for this query.",
      webSourceCount
        ? `${webSourceCount} additional public web source${webSourceCount === 1 ? "" : "s"} were found for review.`
        : "No additional public web sources were found unless a live search provider is configured.",
      question ? `Research question to answer: ${question}` : "No specific admin research question was supplied.",
    ],
    sourceNotes: [
      linkedInSource
        ? `LinkedIn source: ${linkedInSource.url}`
        : "LinkedIn was not verified; Relo is intentionally not showing a search-results URL as a profile.",
      newsCount ? `Recent article titles include: ${newsTitles.slice(0, 2).join("; ")}` : "News coverage is empty for this query.",
    ],
    followUpQuestions: [
      "What exact role, company, or profile detail should the admin verify before acting on this record?",
      "Is there an official company page, speaker page, or event bio that can confirm the target's current position?",
    ],
  };
}

async function withTimeout<T>(promise: Promise<T>, fallback: T, timeoutMs = 5000): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeout = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  const guarded = guardPost(request, "lookup", 20, 60_000);
  if (guarded) return guarded;

  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid JSON" }, { status });
  }

  const parsed = lookupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "attendee is required" }, { status: 400 });
  }

  const [sourceDiscovery, news] = await Promise.all([
    discoverPublicSources(parsed.data.attendee, { context: parsed.data.context }),
    fetchRecentNews({
      name: parsed.data.attendee.name,
      company: parsed.data.attendee.company,
      industry: parsed.data.attendee.industry,
      context: parsed.data.context,
    }),
  ]);
  const attendeeWithResolvedSources = {
    ...parsed.data.attendee,
    linkedinUrl: parsed.data.attendee.linkedinUrl ?? sourceDiscovery.linkedInUrl,
  };
  const result = await scanAttendeeEnrichment(attendeeWithResolvedSources);
  const articleSources: ResearchSource[] = news.map((article) => ({
    type: "news",
    title: article.title,
    url: article.url,
    source: article.source,
    snippet: article.snippet,
    verified: true,
  }));
  const sources = [...sourceDiscovery.sources, ...articleSources];
  const connectionPlan = buildConnectionPlan({
    viewer: parsed.data.viewer,
    attendee: attendeeWithResolvedSources,
    context: parsed.data.context,
    topNewsTitle: news[0]?.title,
  });
  const researchFallback = buildResearchFallback({
    attendee: attendeeWithResolvedSources,
    context: parsed.data.context,
    question: parsed.data.researchQuestion,
    sources,
    newsTitles: news.map((article) => article.title),
  });
  const researchBrief = await aiProvider.generateResearchBrief(
    {
      attendee: attendeeWithResolvedSources,
      context: parsed.data.context,
      question: parsed.data.researchQuestion,
      enrichment: result.enrichment,
      news,
      sources,
    },
    researchFallback
  );
  const personalizedConnectionPlan =
    connectionPlan && parsed.data.viewer
      ? await withTimeout(
          aiProvider.generateConnectionPlan(
            {
              viewer: parsed.data.viewer,
              attendee: attendeeWithResolvedSources,
              context: parsed.data.context,
              sharedContext: parsed.data.sharedContext,
              newsTitles: news.map((article) => article.title),
            },
            connectionPlan
          ),
          connectionPlan
        )
      : null;

  return NextResponse.json({
    result,
    enrichment: result.enrichment,
    news,
    connectionPlan: personalizedConnectionPlan,
    researchBrief,
    sources,
    sourceStatus: sourceDiscovery.status,
    sourceProvider: sourceDiscovery.provider,
    context: parsed.data.context ?? null,
    mode: "public-lookup",
  });
}
