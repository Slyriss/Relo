import { describe, expect, it } from "vitest";
import { profilePhotoPath, validateProfilePhotoSource } from "@/lib/profile-photos";

describe("profile photo storage policy", () => {
  it("accepts ordinary public image URLs", () => {
    const result = validateProfilePhotoSource("https://images.example.com/avatars/maya.jpg");
    expect(result.ok).toBe(true);
  });

  it("blocks LinkedIn-hosted images", () => {
    const result = validateProfilePhotoSource("https://media.licdn.com/dms/image/profile-displayphoto-shrink_800_800/foo");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("LinkedIn-hosted");
  });

  it("blocks private network URLs", () => {
    const result = validateProfilePhotoSource("http://127.0.0.1/avatar.png");
    expect(result.ok).toBe(false);
  });

  it("generates owner-scoped storage paths", () => {
    expect(profilePhotoPath({ type: "attendee", id: "att-1" }, "image/png")).toMatch(/^attendee\/att-1\/\d+\.png$/);
  });
});
