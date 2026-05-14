import {
  createErrorResult,
  createObservedAt,
  createSkippedResult,
  type EnrichmentResult,
  type EnrichmentSignal,
  type EnrichmentSubject,
  type PublicEnrichmentAdapter,
} from "./types";

type PageMetadata = {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  openGraphSiteName?: string;
};

function firstWebsiteUrl(subject: EnrichmentSubject): string | undefined {
  return subject.websiteUrl ?? subject.urls?.find((url) => /^https?:\/\//i.test(url));
}

function getMetaContent(html: string, selector: RegExp): string | undefined {
  return selector.exec(html)?.[1]?.trim();
}

export function extractWebsiteMetadata(html: string): PageMetadata {
  const title = getMetaContent(html, /<title[^>]*>([^<]*)<\/title>/i);
  const description =
    getMetaContent(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i) ??
    getMetaContent(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i);
  const canonicalUrl = getMetaContent(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["'][^>]*>/i);
  const openGraphSiteName =
    getMetaContent(html, /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']*)["'][^>]*>/i) ??
    getMetaContent(html, /<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:site_name["'][^>]*>/i);

  return {
    title,
    description,
    canonicalUrl,
    openGraphSiteName,
  };
}

function metadataSignals(pageUrl: string, metadata: PageMetadata, observedAt: string): EnrichmentSignal[] {
  const signals: EnrichmentSignal[] = [];

  if (metadata.title) {
    signals.push({
      id: `website:${pageUrl}:title`,
      kind: "website",
      source: "website-metadata",
      label: "Page title",
      value: metadata.title,
      url: pageUrl,
      confidence: "high",
      observedAt,
    });
  }

  if (metadata.description) {
    signals.push({
      id: `website:${pageUrl}:description`,
      kind: "metadata",
      source: "website-metadata",
      label: "Meta description",
      value: metadata.description,
      url: pageUrl,
      confidence: "medium",
      observedAt,
    });
  }

  if (metadata.openGraphSiteName) {
    signals.push({
      id: `website:${pageUrl}:site-name`,
      kind: "metadata",
      source: "website-metadata",
      label: "Open Graph site name",
      value: metadata.openGraphSiteName,
      url: pageUrl,
      confidence: "medium",
      observedAt,
    });
  }

  if (metadata.canonicalUrl) {
    signals.push({
      id: `website:${pageUrl}:canonical`,
      kind: "website",
      source: "website-metadata",
      label: "Canonical URL",
      value: metadata.canonicalUrl,
      url: metadata.canonicalUrl,
      confidence: "medium",
      observedAt,
    });
  }

  return signals;
}

export const websiteMetadataAdapter: PublicEnrichmentAdapter = {
  id: "website-metadata",
  name: "Website metadata",
  description: "Fetches a public web page and normalizes common title, description, canonical, and Open Graph metadata.",
  safety: {
    requiresConsent: false,
    publicDataOnly: true,
    notes: [
      "Only reads metadata from a caller-provided public URL.",
      "Does not crawl beyond the provided URL.",
      "Callers should validate allowed hosts before using this adapter in multi-tenant flows.",
    ],
  },
  canEnrich(subject) {
    return Boolean(firstWebsiteUrl(subject));
  },
  async enrich(subject, context, options): Promise<EnrichmentResult> {
    const pageUrl = firstWebsiteUrl(subject);
    if (!pageUrl) {
      return createSkippedResult(this, subject, "A public website URL is required.", context, options);
    }

    const startedAt = createObservedAt(context, options);

    try {
      const fetchImpl = context?.fetch ?? fetch;
      const response = await fetchImpl(pageUrl, {
        headers: {
          Accept: "text/html,application/xhtml+xml",
        },
      });

      if (!response.ok) {
        throw new Error(`Website metadata request failed with HTTP ${response.status}`);
      }

      const html = await response.text();
      const completedAt = createObservedAt(context, options);
      const metadata = extractWebsiteMetadata(html);

      return {
        adapterId: this.id,
        status: "success",
        subject,
        signals: metadataSignals(pageUrl, metadata, completedAt).slice(0, options?.signalLimit),
        safety: this.safety,
        startedAt,
        completedAt,
        metadata: {
          finalUrl: response.url || pageUrl,
        },
      };
    } catch (error) {
      return createErrorResult(this, subject, startedAt, error, context, options);
    }
  },
};
