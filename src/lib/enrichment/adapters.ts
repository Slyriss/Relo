import type {
  EnrichmentAdapterContext,
  EnrichmentResult,
  EnrichmentRunOptions,
  EnrichmentSubject,
  PublicEnrichmentAdapter,
} from "./types";

export type EnrichmentRunSummary = {
  subject: EnrichmentSubject;
  results: EnrichmentResult[];
  signals: EnrichmentResult["signals"];
};

export async function runEnrichmentAdapters(
  adapters: PublicEnrichmentAdapter[],
  subject: EnrichmentSubject,
  context?: EnrichmentAdapterContext,
  options?: EnrichmentRunOptions
): Promise<EnrichmentRunSummary> {
  const runnable = adapters.filter((adapter) => adapter.canEnrich(subject));
  const results = await Promise.all(runnable.map((adapter) => adapter.enrich(subject, context, options)));
  const signals = results.flatMap((result) => result.signals).slice(0, options?.signalLimit);

  return {
    subject,
    results,
    signals,
  };
}

export function filterApplicableAdapters(
  adapters: PublicEnrichmentAdapter[],
  subject: EnrichmentSubject
): PublicEnrichmentAdapter[] {
  return adapters.filter((adapter) => adapter.canEnrich(subject));
}
