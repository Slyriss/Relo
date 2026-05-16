import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/lookup/route";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const attendee = {
  id: "manual-lee-yang-sean",
  eventId: "manual-lookup",
  name: "Lee Yang Sean",
  email: "lee.yang.sean@example.com",
  company: "Jalan Journey",
  title: "EdTech startup builder",
  linkedinUrl: "https://sg.linkedin.com/in/leeyangsean",
  bio: "Singapore startup and education technology context.",
  headline: "EdTech startup builder",
  goals: ["partnerships", "customers", "learning"],
  industry: "EdTech",
  profileComplete: true,
};

const viewer = {
  name: "John Tan",
  title: "Founder",
  company: "Relo",
  goal: "Find pilot users and event partners.",
  offer: "a free event relationship-intelligence pilot",
  background: "Founder of Relo building relationship intelligence for live events.",
};

describe("manual lookup API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns enrichment and recent news material", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          articles: [
            {
              title: "Singapore EdTech founders test AI learning tools",
              url: "https://example.com/singapore-edtech",
              domain: "example.com",
              seendate: "20260514T030000Z",
            },
          ],
        }),
      })
    );

    const response = await POST(jsonRequest({ attendee, viewer, context: "Edutech Startup event in Singapore" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.mode).toBe("public-lookup");
    expect(body.enrichment.attendeeId).toBe(attendee.id);
    expect(body.enrichment.signals.length).toBeGreaterThan(2);
    expect(body.news[0].title).toContain("Singapore EdTech");
    expect(body.connectionPlan.headline).toContain("John Tan");
    expect(body.connectionPlan.partnership).toContain("Relo");
    expect(body.connectionPlan.personalBridge).toContain("Founder");
    expect(body.researchBrief.actionPlan.opener).toBeTruthy();
    expect(body.researchBrief.actionPlan.talkingPoints.length).toBeGreaterThanOrEqual(2);
    expect(body.context).toBe("Edutech Startup event in Singapore");
  });

  it("rejects invalid lookup payloads", async () => {
    const response = await POST(jsonRequest({ attendee: { id: "missing-fields" } }));

    expect(response.status).toBe(400);
  });

  it("adapts fallback advice to non-founder event goals", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("news unavailable")));

    const response = await POST(
      jsonRequest({
        attendee,
        context: "University alumni career night",
        sharedContext: "Both attended the same school.",
        viewer: {
          name: "Maya Lim",
          title: "Computer science student",
          company: "NUS",
          goal: "Learn about AI product careers and find a mentor.",
          offer: "a student perspective on how university builders evaluate AI tools",
          background: "Final-year student exploring AI product roles.",
        },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.connectionPlan.headline).toContain("practical learning");
    expect(body.connectionPlan.risk).toContain("learning");
    expect(body.connectionPlan.personalBridge).toContain("shared school");
  });
});
