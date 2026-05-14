import { NextResponse } from "next/server";
import { z } from "zod";
import { guardPost, readJsonBody, RequestBodyError } from "@/lib/api/security";
import type { CrawledProfile } from "@/types";

const crawlSchema = z.object({
  linkedinUrl: z.string().trim().url().max(500).optional(),
});

function textBetween(html: string, pattern: RegExp) {
  return html.match(pattern)?.[1]?.replace(/\s+/g, " ").trim();
}

function extractPublicMetadata(html: string): CrawledProfile {
  const title =
    textBetween(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i) ??
    textBetween(html, /<title[^>]*>([^<]+)<\/title>/i);
  const description =
    textBetween(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i) ??
    textBetween(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i);

  return {
    headline: title,
    bio: description,
    skills: [],
  };
}

export async function POST(req: Request) {
  const guarded = guardPost(req, "crawl", 20, 60_000);
  if (guarded) return guarded;

  let body: unknown;
  try {
    body = await readJsonBody(req, 8_000);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid JSON" }, { status });
  }

  const parsed = crawlSchema.safeParse(body);
  if (!parsed.success || !parsed.data.linkedinUrl) {
    return NextResponse.json({ error: "A public profile URL is required" }, { status: 400 });
  }

  const url = new URL(parsed.data.linkedinUrl);
  if (url.hostname.includes("linkedin.com")) {
    return NextResponse.json(
      {
        error:
          "LinkedIn pages are not scraped. Paste profile text into the AI profile import field to extract a profile from real user-provided content.",
      },
      { status: 422 }
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Relo profile metadata fetcher" },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json({ error: "Could not read that public page" }, { status: 502 });
    }

    const html = await response.text();
    const profile = extractPublicMetadata(html);
    if (!profile.headline && !profile.bio) {
      return NextResponse.json({ error: "No public profile metadata was found on that page" }, { status: 404 });
    }

    return NextResponse.json({ profile, source: "public-url", scannedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: "Could not fetch that public profile URL" }, { status: 502 });
  }
}
