import OpenAI from "openai";
import { mockFollowup } from "@/lib/ai/followup";
import { mockPrep } from "@/lib/ai/prep";
import { connectionPlanResponseSchema, prepResponseSchema, profileResponseSchema } from "@/lib/ai/schemas";
import { inferGoals, inferIndustry, inferSeniority } from "@/lib/csv";
import { env } from "@/lib/env";
import type { Attendee, Meeting } from "@/types";

export type FollowupInput = {
  meeting: Meeting;
  sender: Attendee;
  recipient: Attendee;
};

export type PrepInput = {
  source: Attendee;
  target: Attendee;
};

export type ConnectionPlanInput = {
  viewer: {
    name: string;
    title: string;
    company: string;
    goal: string;
    offer: string;
    background?: string;
  };
  attendee: Attendee;
  context?: string;
  sharedContext?: string;
  newsTitles?: string[];
};

export type ConnectionPlan = {
  headline: string;
  whyMeet: string;
  personalBridge: string;
  partnership: string;
  ask: string;
  offer: string;
  nextStep: string;
  risk: string;
};

export interface AiProvider {
  generateFollowup(input: FollowupInput): Promise<string>;
  generatePrep(input: PrepInput): Promise<string[]>;
  generateConnectionPlan(input: ConnectionPlanInput, fallback: ConnectionPlan): Promise<ConnectionPlan>;
  parseProfile(text: string): Promise<Partial<Attendee>>;
}

function mockParseProfile(text: string): Partial<Attendee> {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const bio = lines.slice(0, 3).join(" ").slice(0, 120);
  return {
    bio,
    headline: bio,
    goals: inferGoals(text, lines[0] ?? ""),
    industry: inferIndustry("", text),
    seniority: inferSeniority(lines[0] ?? "")
  };
}

class OpenAiProvider implements AiProvider {
  private apiKey = env.DEEPSEEK_API_KEY ?? env.OPENAI_API_KEY;
  private model = env.OPENAI_MODEL ?? (env.DEEPSEEK_API_KEY ? "deepseek-v4-flash" : "gpt-4o-mini");
  private client: OpenAI | null = this.apiKey
    ? new OpenAI({
        apiKey: this.apiKey,
        baseURL: env.OPENAI_BASE_URL ?? (env.DEEPSEEK_API_KEY ? "https://api.deepseek.com" : undefined),
        timeout: env.AI_TIMEOUT_MS,
        maxRetries: env.AI_MAX_RETRIES,
      })
    : null;

  private async withFallback<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await operation();
    } catch {
      return fallback;
    }
  }

  async generateFollowup({ meeting, sender, recipient }: FollowupInput) {
    const fallback = mockFollowup({ meeting, sender, recipient });
    if (!this.client) return fallback;

    return this.withFallback(async () => {
      const response = await this.client!.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "Write concise, warm professional follow-ups. Keep under 120 words and include a concrete next step."
          },
          { role: "user", content: JSON.stringify({ meeting, sender, recipient }) }
        ]
      });

      const content = response.choices[0]?.message.content?.trim();
      return content && content.length <= 1000 ? content : fallback;
    }, fallback);
  }

  async generatePrep({ source, target }: PrepInput): Promise<string[]> {
    const fallback = mockPrep({ source, target });
    if (!this.client) return fallback;

    return this.withFallback(async () => {
      const response = await this.client!.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              'You are a meeting coach. Given two attendee profiles, return exactly 3 concise prep bullets as JSON: {"bullets":["who they are (≤25 words)","why this meeting matters (≤25 words)","one good opening question (≤20 words)"]}.'
          },
          { role: "user", content: JSON.stringify({ source, target }) }
        ],
        response_format: { type: "json_object" }
      });

      const data = prepResponseSchema.parse(JSON.parse(response.choices[0]?.message.content ?? "{}"));
      return data.bullets;
    }, fallback);
  }

  async generateConnectionPlan(input: ConnectionPlanInput, fallback: ConnectionPlan): Promise<ConnectionPlan> {
    if (!this.client) return fallback;

    return this.withFallback(async () => {
      const response = await this.client!.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are Relo's private event networking strategist. Write advice that feels personal, specific, and useful in the 2 minutes before someone approaches a person at an event. Adapt to the actual user and event instead of assuming founder mode. Infer the user's current networking job from their role, company, stated goal, offer, background, event context, shared context, and target profile. Possible jobs include founder/customer discovery, partnerships, hiring, fundraising, sales, recruiting, investing, research, learning, community building, school/alumni networking, career exploration, mentorship, media, and operator knowledge exchange. Choose the most likely job and make the advice fit that job. If the event context changes, the advice should change. If a shared-context clue is provided, turn it into a natural bridge. If no strong bridge exists, say what to ask to discover one. Do not flatter. Do not invent facts. Do not over-index on startups unless the user/event makes that relevant. Avoid generic networking language. Return strict JSON only with headline, whyMeet, personalBridge, partnership, ask, offer, nextStep, risk."
          },
          {
            role: "user",
            content: JSON.stringify({
              viewer: input.viewer,
              target: input.attendee,
              eventContext: input.context,
              sharedContext: input.sharedContext,
              recentNewsTitles: input.newsTitles ?? [],
              outputRules: [
                "Every field must be one or two concrete sentences.",
                "Explain why this target matters to the viewer, not just who the target is.",
                "The advice must change based on the user's event-specific goal.",
                "Make the ask safe and appropriate for the user's role and event.",
                "Make the opportunity testable within one follow-up, whether it is partnership, learning, hiring, investing, sales, mentorship, or collaboration.",
              ],
            }),
          },
        ],
        response_format: { type: "json_object" }
      });

      return connectionPlanResponseSchema.parse(JSON.parse(response.choices[0]?.message.content ?? "{}"));
    }, fallback);
  }

  async parseProfile(text: string): Promise<Partial<Attendee>> {
    const fallback = mockParseProfile(text);
    if (!this.client) return fallback;

    return this.withFallback(async () => {
      const response = await this.client!.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              'Extract structured attendee fields from the provided LinkedIn profile or bio text. Return JSON with these optional fields: {"name":"string","title":"string","company":"string","bio":"string ≤120 chars","goals":["fundraising"|"hiring"|"partnerships"|"customers"|"learning"],"industry":"string","seniority":1-6}. Seniority: 1=entry,2=individual contributor,3=lead,4=VP/head,5=C-suite/founder,6=partner.'
          },
          { role: "user", content: text }
        ],
        response_format: { type: "json_object" }
      });

      return profileResponseSchema.parse(JSON.parse(response.choices[0]?.message.content ?? "{}"));
    }, fallback);
  }
}

export const aiProvider: AiProvider = new OpenAiProvider();
