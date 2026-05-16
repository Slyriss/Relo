import { z } from "zod";
import { aiProvider, type ConnectionPlan, type ResearchBrief } from "@/lib/ai/provider";
import { attendeePayloadSchema } from "@/lib/ai/schemas";
import { scanAttendeeEnrichment } from "@/lib/data/enrichment";
import { fetchRecentNews } from "@/lib/news";
import { discoverPublicSources, type ResearchSource } from "@/lib/research";

const viewerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(160),
  company: z.string().trim().min(1).max(160),
  goal: z.string().trim().min(1).max(300),
  offer: z.string().trim().min(1).max(300),
  background: z.string().trim().max(500).optional(),
});

export const lookupSchema = z.object({
  attendee: attendeePayloadSchema,
  context: z.string().trim().max(500).optional(),
  researchQuestion: z.string().trim().max(500).optional(),
  sharedContext: z.string().trim().max(500).optional(),
  viewer: viewerSchema.optional(),
  persist: z.boolean().default(false),
});

export type LookupInput = z.infer<typeof lookupSchema>;

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
    actionPlan: {
      approach: question
        ? `Use the stated goal as the frame: ${question}. Open with the event context, then ask a short question that lets ${attendee.name} talk about their work before you mention your own agenda.`
        : `Approach ${attendee.name} with a short event-context opener and keep the first exchange focused on learning what they are trying to get out of the room.`,
      opener: context
        ? `Hi ${attendee.name}, I saw your work around ${attendee.company || "this space"} and noticed you're here for ${context}. What part of the event has been most relevant for you so far?`
        : `Hi ${attendee.name}, I saw your work around ${attendee.company || "this space"}. What are you hoping to learn or meet people for today?`,
      talkingPoints: [
        linkedInSource ? "Reference the verified LinkedIn/source context lightly, without sounding like you over-researched them." : "Acknowledge that you only have limited source context and ask them to correct your understanding.",
        newsTitles[0] ? `Use the most relevant company or market article only if it connects naturally: ${newsTitles[0]}.` : `Ask about ${attendee.company || "their work"} and what problems are most active for them right now.`,
        "Keep the conversation centered on their current priority before introducing your own request.",
      ],
      questions: [
        "What brought you to this event, and what would make it useful for you?",
        `How are you thinking about ${attendee.company || "your current work"} in this market right now?`,
        "Is there a type of person here you would be especially glad to meet?",
      ],
      offer: "Offer one useful intro, context note, or follow-up resource based on what they say instead of leading with a broad pitch.",
      followUp: "If the conversation has energy, ask permission to send one concise follow-up with the specific resource, intro, or question you discussed.",
      avoid: [
        "Do not overstate what the sources prove.",
        "Do not open with sensitive company news unless they bring it up first.",
        "Do not make the conversation feel like a scripted pitch.",
      ],
    },
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

export async function runLookupResearch(input: LookupInput) {
  const [sourceDiscovery, news] = await Promise.all([
    discoverPublicSources(input.attendee, { context: input.context }),
    fetchRecentNews({
      name: input.attendee.name,
      company: input.attendee.company,
      industry: input.attendee.industry,
      context: input.context,
    }),
  ]);
  const attendeeWithResolvedSources = {
    ...input.attendee,
    linkedinUrl: input.attendee.linkedinUrl ?? sourceDiscovery.linkedInUrl,
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
    viewer: input.viewer,
    attendee: attendeeWithResolvedSources,
    context: input.context,
    topNewsTitle: news[0]?.title,
  });
  const researchFallback = buildResearchFallback({
    attendee: attendeeWithResolvedSources,
    context: input.context,
    question: input.researchQuestion,
    sources,
    newsTitles: news.map((article) => article.title),
  });
  const researchBrief = await aiProvider.generateResearchBrief(
    {
      attendee: attendeeWithResolvedSources,
      context: input.context,
      question: input.researchQuestion,
      enrichment: result.enrichment,
      news,
      sources,
    },
    researchFallback
  );
  const personalizedConnectionPlan =
    connectionPlan && input.viewer
      ? await withTimeout(
          aiProvider.generateConnectionPlan(
            {
              viewer: input.viewer,
              attendee: attendeeWithResolvedSources,
              context: input.context,
              sharedContext: input.sharedContext,
              newsTitles: news.map((article) => article.title),
            },
            connectionPlan
          ),
          connectionPlan
        )
      : null;

  return {
    result,
    enrichment: result.enrichment,
    news,
    connectionPlan: personalizedConnectionPlan,
    researchBrief,
    sources,
    sourceStatus: sourceDiscovery.status,
    sourceProvider: sourceDiscovery.provider,
    context: input.context ?? null,
    mode: "public-lookup",
  };
}
