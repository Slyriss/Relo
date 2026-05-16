import { describe, expect, it } from "vitest";
import { sanitizeDisplayText } from "@/lib/utils";

describe("sanitizeDisplayText", () => {
  it.each([
    "<img src=x onerror=alert(1)> Pricing note",
    "javascript:alert(1)",
    "Quarterly update <script>alert(1)</script>",
  ])("blocks hostile display payloads: %s", (value) => {
    expect(sanitizeDisplayText(value, "Meeting note needs review")).toBe("Meeting note needs review");
  });

  it("normalizes safe attendee identity and event fields", () => {
    expect(sanitizeDisplayText("  Maya   Patel  ")).toBe("Maya Patel");
    expect(sanitizeDisplayText("Relo Summit 2026")).toBe("Relo Summit 2026");
  });
});
