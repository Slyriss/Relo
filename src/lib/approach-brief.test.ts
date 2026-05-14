import { describe, expect, it } from "vitest";
import { buildApproachBrief } from "@/lib/approach-brief";
import { demoAttendees, demoEvent } from "@/lib/demo-data";

describe("approach brief", () => {
  it("turns a match into a concrete next action", () => {
    const source = demoAttendees[0];
    const target = demoAttendees[1];
    const brief = buildApproachBrief({
      source,
      target,
      event: demoEvent,
      isHere: true,
      match: {
        attendeeId: source.id,
        targetId: target.id,
        score: 82,
        why: ["Investor profile directly aligns with fundraising goals"],
      },
    });

    expect(brief.decision).toBe("meet_now");
    expect(brief.whyNow).toContain("checked in now");
    expect(brief.opener).toContain("What would make this event genuinely useful");
    expect(brief.avoid).toContain("Do not lead with the score");
  });
});
