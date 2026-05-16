import { describe, expect, it } from "vitest";
import { researchBriefResponseSchema } from "@/lib/ai/schemas";

const validResearchBrief = {
  summary: "A source-grounded summary.",
  actionPlan: {
    approach: "Approach with context and ask a relevant opening question.",
    opener: "Hi, I saw your work in this space. What brought you to this event?",
    talkingPoints: ["Recent source context", "Relevant event goal"],
    questions: ["What are you hoping to learn?", "Who would be useful to meet?"],
    offer: "Offer one useful intro or note.",
    followUp: "Send one concise follow-up after the conversation.",
    avoid: ["Do not overstate sources."],
  },
  findings: ["Submitted profile gives role context.", "Live sources need verification."],
  sourceNotes: ["Source coverage is limited."],
  followUpQuestions: ["What should be verified next?"],
};

describe("researchBriefResponseSchema", () => {
  it("requires a complete action plan", () => {
    expect(researchBriefResponseSchema.parse(validResearchBrief).actionPlan.opener).toContain("event");

    const result = researchBriefResponseSchema.safeParse({
      ...validResearchBrief,
      actionPlan: undefined,
    });

    expect(result.success).toBe(false);
  });
});
