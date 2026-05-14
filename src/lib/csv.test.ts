import { describe, expect, it } from "vitest";
import { parseAttendeeCsv } from "@/lib/csv";

describe("parseAttendeeCsv", () => {
  it("parses attendee imports with quoted commas", () => {
    const csv = `name,email,company,title,linkedin_url,bio,photo_url
"Dana Ray",dana@example.com,"Acme, Inc",Founder,https://linkedin.com/in/dana,"Raising seed, looking for customers",https://images.example.com/dana.jpg`;
    const result = parseAttendeeCsv(csv, "event-1");
    expect(result.errors).toEqual([]);
    expect(result.attendees[0]).toMatchObject({
      name: "Dana Ray",
      company: "Acme, Inc",
      photoUrl: "https://images.example.com/dana.jpg",
      goals: expect.arrayContaining(["fundraising", "customers"])
    });
  });

  it("reports missing required columns", () => {
    const result = parseAttendeeCsv("name,email\nAva,ava@example.com", "event-1");
    expect(result.errors[0]).toContain("Missing columns");
  });
});
