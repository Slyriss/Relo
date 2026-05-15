import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function sourceFor(...segments: string[]) {
  return readFileSync(path.join(process.cwd(), ...segments), "utf8");
}

describe("multi-role admin boundary", () => {
  it.each([
    ["dashboard", "src", "app", "dashboard", "layout.tsx"],
    ["settings", "src", "app", "settings", "layout.tsx"],
    ["organization", "src", "app", "org", "layout.tsx"]
  ])("%s route tree is wrapped by the admin guard", (_name, ...segments) => {
    const source = sourceFor(...segments);

    expect(source).toContain('import { AdminRouteGuard } from "@/components/admin-route-guard"');
    expect(source).toContain("<AdminRouteGuard>");
  });

  it("treats attendee as the only role excluded from admin routes", () => {
    const source = sourceFor("src", "components", "admin-route-guard.tsx");

    expect(source).toMatch(/user\?\.role === "attendee"/);
    expect(source).toMatch(/user\.role === "attendee"/);
    expect(source).not.toMatch(/user(?:\?|\.)?\.role === "organizer"/);
    expect(source).not.toMatch(/user(?:\?|\.)?\.role === "admin"/);
  });

  it("redirects attendees to participant event space instead of admin surfaces", () => {
    const source = sourceFor("src", "components", "admin-route-guard.tsx");

    expect(source).toContain('router.replace(participantHome(events))');
    expect(source).toContain('return event ? `/events/${event.id || event.slug}` : "/setup"');
  });

  it("keeps attendee, organizer, and admin in the shared role contract", () => {
    const source = sourceFor("src", "types", "index.ts");

    expect(source).toContain('export type Role = "attendee" | "organizer" | "admin"');
  });

  it("wraps participant event routes with the participant guard", () => {
    const source = sourceFor("src", "app", "events", "[id]", "layout.tsx");

    expect(source).toContain('import { ParticipantRouteGuard } from "@/components/participant-route-guard"');
    expect(source).toContain("<ParticipantRouteGuard eventId={id}>");
  });

  it("redirects admins away from attendee event routes", () => {
    const source = sourceFor("src", "components", "participant-route-guard.tsx");

    expect(source).toContain('user?.role === "organizer" || user?.role === "admin"');
    expect(source).toContain("router.replace(`/dashboard/events/${resolvedEventId}`)");
  });

  it("keeps event graph out of the attendee surface", () => {
    const source = sourceFor("src", "app", "events", "[id]", "graph", "page.tsx");

    expect(source).toContain('redirect(`/events/${id}`)');
    expect(source).not.toContain("graphifyEventNetwork");
  });

  it("requires admin context for organizer-only mutation APIs", () => {
    for (const route of [
      ["src", "app", "api", "events", "route.ts"],
      ["src", "app", "api", "attendees", "route.ts"],
    ]) {
      const source = sourceFor(...route);
      expect(source).toContain("requireAdminUser");
    }
  });

  it("does not accept self-service role escalation", () => {
    const source = sourceFor("src", "app", "api", "users", "me", "route.ts");

    expect(source).toContain("Role changes require admin access");
    expect(source).not.toContain("role: body.role");
  });
});
