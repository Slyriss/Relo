import { describe, expect, it, vi } from "vitest";
import {
  createExternalToolAdapter,
  externalToolConfigs,
  extractWebsiteMetadata,
  githubPublicProfileAdapter,
  runEnrichmentAdapters,
  websiteMetadataAdapter,
} from "./index";

const fixedNow = new Date("2026-01-01T00:00:00.000Z");

describe("public enrichment adapter layer", () => {
  it("normalizes GitHub public profile metadata into signals", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "x-ratelimit-remaining": "59" }),
      json: async () => ({
        login: "octocat",
        name: "The Octocat",
        html_url: "https://github.com/octocat",
        blog: "https://example.com",
        company: "@github",
        location: "San Francisco",
        bio: "GitHub mascot",
        public_repos: 8,
        followers: 123,
        following: 9,
        created_at: "2011-01-25T18:44:36Z",
        updated_at: "2025-01-01T00:00:00Z",
      }),
    });

    const result = await githubPublicProfileAdapter.enrich(
      { githubUsername: "@octocat" },
      { fetch, now: () => fixedNow },
      { signalLimit: 3 }
    );

    expect(fetch).toHaveBeenCalledWith("https://api.github.com/users/octocat", expect.any(Object));
    expect(result.status).toBe("success");
    expect(result.signals).toHaveLength(3);
    expect(result.signals[0]).toMatchObject({
      kind: "profile",
      source: "github",
      value: "The Octocat (@octocat)",
      confidence: "high",
      observedAt: fixedNow.toISOString(),
    });
  });

  it("extracts and normalizes website metadata without crawling links", async () => {
    const html = `
      <html>
        <head>
          <title>Relo</title>
          <meta name="description" content="Relationship intelligence for events">
          <meta property="og:site_name" content="Relo">
          <link rel="canonical" href="https://relo.example/">
        </head>
      </html>
    `;
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      url: "https://relo.example/",
      text: async () => html,
    });

    const result = await websiteMetadataAdapter.enrich(
      { websiteUrl: "https://relo.example" },
      { fetch, now: () => fixedNow }
    );

    expect(extractWebsiteMetadata(html)).toMatchObject({
      title: "Relo",
      description: "Relationship intelligence for events",
      canonicalUrl: "https://relo.example/",
      openGraphSiteName: "Relo",
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.signals.map((signal) => signal.label)).toEqual([
      "Page title",
      "Meta description",
      "Open Graph site name",
      "Canonical URL",
    ]);
  });

  it("keeps external tools as explicit runner stubs with safety metadata", async () => {
    const adapter = createExternalToolAdapter(externalToolConfigs.holehe);
    const result = await adapter.enrich({ email: "person@example.com" }, { now: () => fixedNow });

    expect(adapter.canEnrich({ email: "person@example.com" })).toBe(true);
    expect(result.status).toBe("skipped");
    expect(result.error?.code).toBe("external_runner_missing");
    expect(result.safety.requiresConsent).toBe(true);
    expect(result.metadata).toMatchObject({
      executable: "holehe",
      homepage: "https://github.com/megadose/holehe",
    });
  });

  it("runs only applicable adapters and flattens normalized signals", async () => {
    const summary = await runEnrichmentAdapters(
      [websiteMetadataAdapter, createExternalToolAdapter(externalToolConfigs.maigret)],
      { websiteUrl: "https://example.com", username: "founder" },
      {
        now: () => fixedNow,
        fetch: vi.fn().mockResolvedValue({
          ok: true,
          url: "https://example.com",
          text: async () => "<title>Example</title>",
        }),
      }
    );

    expect(summary.results).toHaveLength(2);
    expect(summary.signals).toHaveLength(1);
    expect(summary.signals[0].source).toBe("website-metadata");
  });
});
