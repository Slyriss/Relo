import { describe, expect, it } from "vitest";
import { mapSignupError, passwordValidationMessage } from "@/lib/auth/messages";

describe("auth messages", () => {
  it.each([
    ["User already registered", "This email already has an account. Sign in instead."],
    ["Email address is invalid", "Use a valid work email address for your Relo account."],
    ["Password should be at least 8 characters", "Create a stronger password with at least 8 characters."],
    ["Unsupported provider: provider is not enabled", "That sign-in provider is not ready yet. Use email and password, or ask your admin to enable Google."],
    ["Backend exploded", "Could not create this account. Check the details and try again."],
  ])("maps %s", (message, expected) => {
    expect(mapSignupError(message)).toBe(expected);
  });

  it("validates short passwords", () => {
    expect(passwordValidationMessage("short")).toBe("Use at least 8 characters.");
    expect(passwordValidationMessage("long-enough")).toBe("");
  });
});
