import { describe, expect, it } from "vitest";
import { POST as followupPost } from "@/app/api/followup/route";
import { POST as prepPost } from "@/app/api/prep/route";
import { POST as profileParsePost } from "@/app/api/profile-parse/route";
import { demoAttendees, demoMeetings } from "@/lib/demo-data";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("AI API routes", () => {
  it("rejects invalid prep payloads", async () => {
    const response = await prepPost(jsonRequest({ source: { id: "missing-fields" } }));

    expect(response.status).toBe(400);
  });

  it("returns prep bullets for valid payloads", async () => {
    const response = await prepPost(jsonRequest({
      source: demoAttendees[0],
      target: demoAttendees[1],
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.bullets).toHaveLength(3);
  });

  it("rejects invalid followup payloads", async () => {
    const response = await followupPost(jsonRequest({ meeting: demoMeetings[0] }));

    expect(response.status).toBe(400);
  });

  it("returns a parsed profile for valid text", async () => {
    const response = await profileParsePost(jsonRequest({
      text: "Founder and CEO at Orbit AI. Building infrastructure for AI teams.",
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.profile.bio).toBeTruthy();
  });
});
