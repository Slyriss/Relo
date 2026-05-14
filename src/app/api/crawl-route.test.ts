import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/crawl/route";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/crawl", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("profile discovery API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects LinkedIn scraping instead of returning fixture data", async () => {
    const response = await POST(jsonRequest({ linkedinUrl: "https://www.linkedin.com/in/leeyangsean/" }));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error).toContain("not scraped");
  });

  it("extracts public metadata from a real fetch response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(
            "<html><head><title>Charisse Chua - Founder</title><meta name=\"description\" content=\"Founder building customer research tooling.\" /></head></html>"
          ),
      })
    );

    const response = await POST(jsonRequest({ linkedinUrl: "https://example.com/charisse" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.source).toBe("public-url");
    expect(body.profile.headline).toBe("Charisse Chua - Founder");
    expect(body.profile.bio).toBe("Founder building customer research tooling.");
  });
});
