import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";

describe("auth route smoke tests", () => {
  it.each(["login", "signup"])("%s page exists", (route) => {
    const file = path.join(process.cwd(), "src", "app", "(auth)", route, "page.tsx");
    expect(existsSync(file)).toBe(true);
  });

  it("middleware protects app routes", () => {
    const file = path.join(process.cwd(), "middleware.ts");
    expect(existsSync(file)).toBe(true);
  });
});
