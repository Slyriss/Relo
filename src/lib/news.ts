export type NewsArticle = {
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
  snippet?: string;
};

type GdeltArticle = {
  title?: string;
  url?: string;
  domain?: string;
  seendate?: string;
  socialimage?: string;
  sourcecountry?: string;
  language?: string;
};

type GdeltResponse = {
  articles?: GdeltArticle[];
};

function compactQuery(parts: Array<string | undefined>) {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .map((part) => (part.includes(" ") ? `"${part}"` : part))
    .join(" ");
}

function uniqueQueries(queries: string[]) {
  return Array.from(new Set(queries.map((query) => query.trim()).filter(Boolean)));
}

export function buildNewsQuery({
  name,
  company,
  industry,
  context,
}: {
  name?: string;
  company?: string;
  industry?: string;
  context?: string;
}) {
  const base = compactQuery([company, industry, context]);
  if (base) return base;
  return compactQuery([name, industry, "startup"]);
}

export function buildNewsQueries(input: {
  name?: string;
  company?: string;
  industry?: string;
  context?: string;
}) {
  const industry = input.industry;
  const expandedIndustry =
    industry?.toLowerCase() === "edtech" ? "education technology" : industry;

  return uniqueQueries([
    buildNewsQuery(input),
    compactQuery([industry, input.context]),
    compactQuery([expandedIndustry, input.context]),
    compactQuery([industry, "Singapore", "startup"]),
    compactQuery([expandedIndustry, "Singapore", "startup"]),
    compactQuery([expandedIndustry, "Asia", "funding"]),
    compactQuery([input.context, "startup"]),
  ]);
}

async function fetchGdeltArticles(
  query: string,
  fetchImpl: typeof fetch,
  limit: number,
  signal: AbortSignal
): Promise<NewsArticle[]> {
  const params = new URLSearchParams({
    query,
    mode: "artlist",
    format: "json",
    maxrecords: String(limit),
    sort: "hybridrel",
  });

  const response = await fetchImpl(`https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) return [];

  const data = (await response.json()) as GdeltResponse;
  return (data.articles ?? [])
    .filter((article) => article.title && article.url)
    .map((article) => ({
      title: article.title!,
      url: article.url!,
      source: article.domain ?? new URL(article.url!).hostname,
      publishedAt: article.seendate,
      snippet: [article.sourcecountry, article.language].filter(Boolean).join(" · ") || undefined,
    }));
}

export async function fetchRecentNews(
  input: {
    name?: string;
    company?: string;
    industry?: string;
    context?: string;
  },
  options: {
    fetchImpl?: typeof fetch;
    limit?: number;
    timeoutMs?: number;
  } = {}
): Promise<NewsArticle[]> {
  const queries = buildNewsQueries(input);
  if (!queries.length) return [];

  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 6000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const limit = options.limit ?? 6;

  try {
    const results = await Promise.allSettled(
      queries.map((query) => fetchGdeltArticles(query, fetchImpl, limit, controller.signal))
    );
    const articles = results
      .filter((result): result is PromiseFulfilledResult<NewsArticle[]> => result.status === "fulfilled")
      .flatMap((result) => result.value);
    const seen = new Set<string>();
    const uniqueArticles = articles.filter((article) => {
      if (seen.has(article.url)) return false;
      seen.add(article.url);
      return true;
    });

    if (uniqueArticles.length) return uniqueArticles.slice(0, limit);
    return [];
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
