import { env } from "@/lib/env";

export type TinyFishSearchResult = {
  title: string;
  url: string;
  snippet?: string;
};

export type TinyFishFetchResult = {
  url: string;
  title?: string;
  markdown?: string;
  text?: string;
};

type TinyFishFetchResponse = {
  results?: TinyFishFetchResult[];
};

export function tinyFishAvailable() {
  return Boolean(env.TINYFISH_API_KEY);
}

export async function tinyFishSearch(query: string, limit = 5): Promise<TinyFishSearchResult[]> {
  if (!env.TINYFISH_API_KEY) return [];

  const url = new URL("https://api.search.tinyfish.ai/");
  url.searchParams.set("query", query);
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url, {
    headers: { "X-API-Key": env.TINYFISH_API_KEY },
  });
  if (!response.ok) throw new Error(`TinyFish Search failed: ${response.status}`);

  const body = (await response.json()) as { results?: TinyFishSearchResult[] };
  return body.results ?? [];
}

export async function tinyFishFetch(url: string): Promise<TinyFishFetchResult | null> {
  if (!env.TINYFISH_API_KEY) return null;

  const response = await fetch("https://api.fetch.tinyfish.ai/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": env.TINYFISH_API_KEY,
    },
    body: JSON.stringify({ urls: [url], format: "markdown" }),
  });
  if (!response.ok) throw new Error(`TinyFish Fetch failed: ${response.status}`);

  const body = (await response.json()) as TinyFishFetchResponse;
  return body.results?.[0] ?? null;
}
