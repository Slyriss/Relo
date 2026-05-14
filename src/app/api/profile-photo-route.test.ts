import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/profile-photo/route";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/profile-photo", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("profile photo API", () => {
  it("rejects LinkedIn-hosted profile photos before storage", async () => {
    const response = await POST(jsonRequest({
      imageUrl: "https://media.licdn.com/dms/image/profile-displayphoto-shrink_800_800/foo",
      ownerType: "attendee",
      ownerId: "att-1",
    }));
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toContain("LinkedIn-hosted");
  });
});
