import { describe, expect, it, vi } from "vitest";
import { buildNewsQueries, fetchRecentNews } from "@/lib/news";

describe("recent news lookup", () => {
  it("builds fallback queries from company, industry, and event context", () => {
    const queries = buildNewsQueries({
      company: "Jalan Journey",
      industry: "EdTech",
      context: "Edutech Startup event in Singapore",
    });

    expect(queries[0]).toContain('"Jalan Journey"');
    expect(queries.some((query) => query.includes("EdTech"))).toBe(true);
    expect(queries.some((query) => query.includes("Singapore"))).toBe(true);
  });

  it("queries broader industry news when the narrow company query is empty", async () => {
    const fetchImpl = vi.fn((url: string) => {
      const decodedUrl = decodeURIComponent(url).replace(/\+/g, " ");
      if (decodedUrl.includes("education technology")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            articles: [
              {
                title: "Singapore startups expand AI tutoring pilots",
                url: "https://example.com/edtech-ai",
                domain: "example.com",
                seendate: "20260514T040000Z",
                sourcecountry: "Singapore",
                language: "English",
              },
            ],
          }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({ articles: [] }),
      });
    });

    const articles = await fetchRecentNews(
      {
        company: "Jalan Journey",
        industry: "EdTech",
        context: "Edutech Startup event in Singapore",
      },
      { fetchImpl: fetchImpl as unknown as typeof fetch, limit: 3 }
    );

    expect(fetchImpl).toHaveBeenCalled();
    expect(articles).toEqual([
      {
        title: "Singapore startups expand AI tutoring pilots",
        url: "https://example.com/edtech-ai",
        source: "example.com",
        publishedAt: "20260514T040000Z",
        snippet: "Singapore · English",
      },
    ]);
  });
});
