import type { SupabaseClient } from "@supabase/supabase-js";
import { enrichAttendee } from "@/lib/enrichment";
import type { PersonEnrichment, PublicSignal } from "@/lib/enrichment";
import type { Attendee } from "@/types";
import type { Database, Json } from "@/types/database";

export type EnrichmentPersistenceClient = SupabaseClient<Database>;

export type EnrichmentScanStatus = "queued" | "scanning" | "ready" | "error";

export type EnrichmentSourceSummary = {
  mode: "public-enrichment";
  signalCount: number;
  strategyCount: number;
};

export type CachedEnrichmentResult = {
  attendeeId: string;
  status: EnrichmentScanStatus;
  enrichment: PersonEnrichment;
  signals: PublicSignal[];
  cached: boolean;
  persisted: boolean;
  sourceSummary: EnrichmentSourceSummary;
  scannedAt: string;
};

function sourceSummary(enrichment: PersonEnrichment): EnrichmentSourceSummary {
  return {
    mode: "public-enrichment",
    signalCount: enrichment.signals.length,
    strategyCount: enrichment.strategy.length,
  };
}

export function normalizeEnrichmentResult(
  enrichment: PersonEnrichment,
  options: {
    cached?: boolean;
    persisted?: boolean;
    status?: EnrichmentScanStatus;
  } = {}
): CachedEnrichmentResult {
  return {
    attendeeId: enrichment.attendeeId,
    status: options.status ?? "ready",
    enrichment,
    signals: enrichment.signals,
    cached: options.cached ?? false,
    persisted: options.persisted ?? false,
    sourceSummary: sourceSummary(enrichment),
    scannedAt: enrichment.scannedAt,
  };
}

export async function persistEnrichment(client: EnrichmentPersistenceClient, enrichment: PersonEnrichment): Promise<void> {
  const summary = sourceSummary(enrichment);
  const { data, error } = await client
    .from("person_enrichments")
    .upsert(
      {
        attendee_id: enrichment.attendeeId,
        status: "ready",
        public_profile_url: enrichment.publicProfileUrl ?? null,
        industry: enrichment.industry,
        likely_focus: enrichment.likelyFocus,
        company_news: enrichment.companyNews,
        strategy: enrichment.strategy,
        confidence: enrichment.confidence,
        source_summary: summary as Json,
        scanned_at: enrichment.scannedAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "attendee_id" }
    )
    .select("id")
    .single();

  if (error) throw error;
  if (!data?.id) throw new Error("Enrichment persistence did not return an id");

  const { error: deleteError } = await client.from("public_profile_signals").delete().eq("enrichment_id", data.id);
  if (deleteError) throw deleteError;

  if (enrichment.signals.length === 0) return;

  const { error: insertError } = await client.from("public_profile_signals").insert(
    enrichment.signals.map((signal) => ({
      enrichment_id: data.id,
      source: signal.source,
      label: signal.label,
      value: signal.value,
      url: signal.url ?? null,
      confidence: signal.confidence,
      observed_at: enrichment.scannedAt,
    }))
  );

  if (insertError) throw insertError;
}

export async function scanAttendeeEnrichment(
  attendee: Attendee,
  options: {
    client?: EnrichmentPersistenceClient | null;
  } = {}
): Promise<CachedEnrichmentResult> {
  const enrichment = enrichAttendee(attendee);

  if (!options.client) {
    return normalizeEnrichmentResult(enrichment);
  }

  try {
    await persistEnrichment(options.client, enrichment);
    return normalizeEnrichmentResult(enrichment, { persisted: true });
  } catch {
    return normalizeEnrichmentResult(enrichment);
  }
}
