import { describe, expect, it } from "vitest";
import { scoreMatch, scoreMatches } from "@/lib/ai/matching";
import { demoAttendees } from "@/lib/demo-data";

describe("match scoring", () => {
  it("ranks compatible attendees above unrelated attendees", () => {
    const founder = demoAttendees.find((attendee) => attendee.id === "att-1")!;
    const investor = demoAttendees.find((attendee) => attendee.id === "att-2")!;
    const people = demoAttendees.find((attendee) => attendee.id === "att-3")!;

    expect(scoreMatch(founder, investor).score).toBeGreaterThan(scoreMatch(founder, people).score);
  });

  it("does not recommend the attendee to themselves", () => {
    const attendee = demoAttendees[0];
    const matches = scoreMatches(attendee, demoAttendees);
    expect(matches.some((match) => match.targetId === attendee.id)).toBe(false);
  });
});
