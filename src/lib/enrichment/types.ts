export type EnrichmentSignalKind =
  | "profile"
  | "repository"
  | "website"
  | "identity"
  | "contact"
  | "security"
  | "metadata"
  | "external-tool";

export type EnrichmentConfidence = "low" | "medium" | "high";

export type EnrichmentSignal = {
  id: string;
  kind: EnrichmentSignalKind;
  source: string;
  label: string;
  value: string;
  url?: string;
  confidence: EnrichmentConfidence;
  observedAt: string;
  metadata?: Record<string, unknown>;
};

export type EnrichmentSubject = {
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  urls?: string[];
  websiteUrl?: string;
  githubUsername?: string;
};

export type EnrichmentFinding = {
  signal: EnrichmentSignal;
  raw?: unknown;
};

export type EnrichmentResultStatus = "success" | "skipped" | "error";

export type EnrichmentSafety = {
  requiresConsent: boolean;
  publicDataOnly: boolean;
  notes: string[];
};

export type EnrichmentResult = {
  adapterId: string;
  status: EnrichmentResultStatus;
  subject: EnrichmentSubject;
  signals: EnrichmentSignal[];
  safety: EnrichmentSafety;
  startedAt: string;
  completedAt: string;
  error?: {
    message: string;
    code?: string;
  };
  metadata?: Record<string, unknown>;
};

export type EnrichmentRunOptions = {
  now?: Date;
  signalLimit?: number;
};

export type EnrichmentAdapterContext = {
  fetch?: typeof fetch;
  now?: () => Date;
};

export type PublicEnrichmentAdapter = {
  id: string;
  name: string;
  description: string;
  safety: EnrichmentSafety;
  canEnrich(subject: EnrichmentSubject): boolean;
  enrich(subject: EnrichmentSubject, context?: EnrichmentAdapterContext, options?: EnrichmentRunOptions): Promise<EnrichmentResult>;
};

export function createObservedAt(context?: EnrichmentAdapterContext, options?: EnrichmentRunOptions): string {
  return (options?.now ?? context?.now?.() ?? new Date()).toISOString();
}

export function createSkippedResult(
  adapter: Pick<PublicEnrichmentAdapter, "id" | "safety">,
  subject: EnrichmentSubject,
  message: string,
  context?: EnrichmentAdapterContext,
  options?: EnrichmentRunOptions
): EnrichmentResult {
  const timestamp = createObservedAt(context, options);

  return {
    adapterId: adapter.id,
    status: "skipped",
    subject,
    signals: [],
    safety: adapter.safety,
    startedAt: timestamp,
    completedAt: timestamp,
    error: { message, code: "adapter_not_applicable" },
  };
}

export function createErrorResult(
  adapter: Pick<PublicEnrichmentAdapter, "id" | "safety">,
  subject: EnrichmentSubject,
  startedAt: string,
  error: unknown,
  context?: EnrichmentAdapterContext,
  options?: EnrichmentRunOptions
): EnrichmentResult {
  const message = error instanceof Error ? error.message : "Unknown enrichment adapter error";

  return {
    adapterId: adapter.id,
    status: "error",
    subject,
    signals: [],
    safety: adapter.safety,
    startedAt,
    completedAt: createObservedAt(context, options),
    error: { message, code: "adapter_error" },
  };
}
