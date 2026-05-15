import { tinyFishAvailable, tinyFishFetch, tinyFishSearch } from "@/lib/enrichment/tinyfish";
import { env } from "@/lib/env";
import type { Attendee } from "@/types";

export type ResearchSource = {
  type: "linkedin" | "web" | "news";
  title: string;
  url: string;
  source: string;
  snippet?: string;
  excerpt?: string;
  verified: boolean;
};

export type SourceDiscovery = {
  sources: ResearchSource[];
  linkedInUrl?: string;
  provider: "multi" | "tinyfish" | "brave" | "submitted-only";
  status: string;
};

type BraveSearchResult = {
  title?: string;
  url?: string;
  description?: string;
};

type BraveSearchResponse = {
  web?: { results?: BraveSearchResult[] };
};

function hostFor(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "public web";
  }
}

function isLinkedInProfileUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes("linkedin.com") && parsed.pathname.startsWith("/in/");
  } catch {
    return false;
  }
}

function cleanTitle(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function dedupeSources(sources: ResearchSource[]) {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = source.url.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function braveAvailable() {
  return Boolean(env.BRAVE_SEARCH_API_KEY);
}

async function braveSearch(query: string, limit = 5): Promise<ResearchSource[]> {
  if (!env.BRAVE_SEARCH_API_KEY) return [];

  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(limit));
  url.searchParams.set("search_lang", "en");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": env.BRAVE_SEARCH_API_KEY,
    },
  });
  if (!response.ok) throw new Error(`Brave Search failed: ${response.status}`);

  const body = (await response.json()) as BraveSearchResponse;
  return (body.web?.results ?? [])
    .filter((result) => result.url)
    .map((result) => ({
      type: isLinkedInProfileUrl(result.url!) ? "linkedin" : "web",
      title: cleanTitle(result.title || result.url!),
      url: result.url!,
      source: hostFor(result.url!),
      snippet: result.description,
      verified: true,
    }));
}

async function fetchSourceExcerpts(sources: ResearchSource[]) {
  if (!tinyFishAvailable()) return sources;

  const fetchable = sources.filter((source) => source.type !== "linkedin").slice(0, 3);
  const settled = await Promise.allSettled(fetchable.map((source) => tinyFishFetch(source.url)));
  const excerpts = new Map<string, string>();
  settled.forEach((result, index) => {
    if (result.status !== "fulfilled") return;
    const source = fetchable[index];
    const text = result.value?.markdown ?? result.value?.text ?? "";
    if (!source || !text) return;
    excerpts.set(source.url, text.replace(/\s+/g, " ").trim().slice(0, 700));
  });

  return sources.map((source) => ({ ...source, excerpt: excerpts.get(source.url) ?? source.excerpt }));
}

export async function discoverPublicSources(
  attendee: Attendee,
  options: {
    context?: string;
    limit?: number;
  } = {}
): Promise<SourceDiscovery> {
  const limit = options.limit ?? 6;
  const sources: ResearchSource[] = [];

  if (attendee.linkedinUrl) {
    sources.push({
      type: "linkedin",
      title: `${attendee.name} LinkedIn profile`,
      url: attendee.linkedinUrl,
      source: hostFor(attendee.linkedinUrl),
      verified: true,
    });
  }

  const hasTinyFish = tinyFishAvailable();
  const hasBrave = braveAvailable();

  if (!hasTinyFish && !hasBrave) {
    return {
      sources,
      linkedInUrl: attendee.linkedinUrl,
      provider: "submitted-only",
      status: attendee.linkedinUrl
        ? "Using the submitted LinkedIn URL. Live web source discovery needs TINYFISH_API_KEY or BRAVE_SEARCH_API_KEY."
        : "Live web source discovery needs TINYFISH_API_KEY or BRAVE_SEARCH_API_KEY. The app will not fabricate a LinkedIn profile URL.",
    };
  }

  const queries = [
    `"${attendee.name}" "${attendee.company}" LinkedIn`,
    `"${attendee.name}" "${attendee.company}" ${options.context ?? ""}`,
    `"${attendee.name}" "${attendee.title}" ${attendee.company}`,
  ].filter((query) => query.replace(/["\s]/g, "").length > 0);

  const tinyFishSettled = hasTinyFish ? await Promise.allSettled(queries.map((query) => tinyFishSearch(query, limit))) : [];
  const tinyFishResults = tinyFishSettled
    .filter((result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof tinyFishSearch>>> => result.status === "fulfilled")
    .flatMap((result) => result.value)
    .map((result) => ({
      type: isLinkedInProfileUrl(result.url) ? "linkedin" : "web",
      title: cleanTitle(result.title || result.url),
      url: result.url,
      source: hostFor(result.url),
      snippet: result.snippet,
      verified: true,
    } satisfies ResearchSource));
  const braveSettled = hasBrave ? await Promise.allSettled(queries.map((query) => braveSearch(query, limit))) : [];
  const braveResults = braveSettled
    .filter((result): result is PromiseFulfilledResult<ResearchSource[]> => result.status === "fulfilled")
    .flatMap((result) => result.value);
  const results = [...tinyFishResults, ...braveResults];

  const linkedInCandidate = attendee.linkedinUrl ?? results.find((result) => isLinkedInProfileUrl(result.url))?.url;

  if (linkedInCandidate && !sources.some((source) => source.url === linkedInCandidate)) {
    sources.push({
      type: "linkedin",
      title: `${attendee.name} LinkedIn profile`,
      url: linkedInCandidate,
      source: hostFor(linkedInCandidate),
      verified: true,
    });
  }

  for (const result of results) {
    if (!result.url || sources.length >= limit) continue;
    sources.push({ ...result, verified: result.type === "linkedin" ? result.url === linkedInCandidate : result.verified });
  }

  const provider = hasTinyFish && hasBrave ? "multi" : hasTinyFish ? "tinyfish" : "brave";

  return {
    sources: await fetchSourceExcerpts(dedupeSources(sources).slice(0, limit)),
    linkedInUrl: linkedInCandidate,
    provider,
    status:
      provider === "multi"
        ? "Live web source discovery completed with TinyFish and Brave Search."
        : provider === "tinyfish"
          ? "Live web source discovery completed with TinyFish."
          : "Live web source discovery completed with Brave Search.",
  };
}
