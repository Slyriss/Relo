import { describe, expect, it } from "vitest";
import { POST as batchPost } from "@/app/api/enrichment/batch/route";
import { POST as scanPost } from "@/app/api/enrichment/scan/route";
import { demoAttendees } from "@/lib/demo-data";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("enrichment scan API routes", () => {
  it("returns a normalized cached-style scan result", async () => {
    const response = await scanPost(jsonRequest({ attendee: demoAttendees[0], persist: false }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.mode).toBe("public-enrichment");
    expect(body.result.attendeeId).toBe(demoAttendees[0].id);
    expect(body.result.status).toBe("ready");
    expect(body.result.cached).toBe(false);
    expect(body.result.persisted).toBe(false);
    expect(body.result.signals.length).toBeGreaterThan(2);
    expect(body.result.sourceSummary.mode).toBe("public-enrichment");
    expect(body.enrichment.attendeeId).toBe(demoAttendees[0].id);
  });

  it("rejects invalid scan payloads", async () => {
    const response = await scanPost(jsonRequest({ attendee: { id: "missing-fields" } }));

    expect(response.status).toBe(400);
  });

  it("returns normalized results for a batch", async () => {
    const attendees = demoAttendees.slice(0, 3);
    const response = await batchPost(jsonRequest({ attendees, persist: false }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.count).toBe(3);
    expect(body.results.map((result: { attendeeId: string }) => result.attendeeId)).toEqual(
      attendees.map((attendee) => attendee.id)
    );
    expect(body.results.every((result: { status: string }) => result.status === "ready")).toBe(true);
  });

  it("rejects empty batch payloads", async () => {
    const response = await batchPost(jsonRequest({ attendees: [] }));

    expect(response.status).toBe(400);
  });
});
