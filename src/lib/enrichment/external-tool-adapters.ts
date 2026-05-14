import {
  createObservedAt,
  createSkippedResult,
  type EnrichmentAdapterContext,
  type EnrichmentResult,
  type EnrichmentRunOptions,
  type EnrichmentSafety,
  type EnrichmentSubject,
  type PublicEnrichmentAdapter,
} from "./types";

export type ExternalEnrichmentToolId = "maigret" | "sherlock" | "whatsmyname" | "socialscan" | "holehe";

export type ExternalToolConfig = {
  id: ExternalEnrichmentToolId;
  displayName: string;
  executable: string;
  homepage: string;
  acceptedInputs: Array<keyof Pick<EnrichmentSubject, "username" | "email">>;
  defaultArgs: string[];
  safety: EnrichmentSafety;
};

export type ExternalToolRunner = (
  config: ExternalToolConfig,
  subject: EnrichmentSubject,
  options?: EnrichmentRunOptions
) => Promise<EnrichmentResult>;

const usernameSafetyNotes = [
  "Use only for user-provided identifiers or identifiers the organization is authorized to investigate.",
  "Do not use results to infer sensitive traits or make automated eligibility decisions.",
  "Respect website terms, rate limits, robots policies, and regional privacy obligations.",
];

const emailSafetyNotes = [
  "Run only with consent or another documented lawful basis.",
  "Do not attempt login, password reset, bypass, or account takeover workflows.",
  "Treat existence checks as sensitive personal data and minimize retention.",
];

export const externalToolConfigs: Record<ExternalEnrichmentToolId, ExternalToolConfig> = {
  maigret: {
    id: "maigret",
    displayName: "Maigret",
    executable: "maigret",
    homepage: "https://github.com/soxoj/maigret",
    acceptedInputs: ["username"],
    defaultArgs: ["--json", "--no-color"],
    safety: {
      requiresConsent: true,
      publicDataOnly: true,
      notes: usernameSafetyNotes,
    },
  },
  sherlock: {
    id: "sherlock",
    displayName: "Sherlock",
    executable: "sherlock",
    homepage: "https://github.com/sherlock-project/sherlock",
    acceptedInputs: ["username"],
    defaultArgs: ["--json"],
    safety: {
      requiresConsent: true,
      publicDataOnly: true,
      notes: usernameSafetyNotes,
    },
  },
  whatsmyname: {
    id: "whatsmyname",
    displayName: "WhatsMyName",
    executable: "whatsmyname",
    homepage: "https://github.com/WebBreacher/WhatsMyName",
    acceptedInputs: ["username"],
    defaultArgs: ["--json"],
    safety: {
      requiresConsent: true,
      publicDataOnly: true,
      notes: usernameSafetyNotes,
    },
  },
  socialscan: {
    id: "socialscan",
    displayName: "socialscan",
    executable: "socialscan",
    homepage: "https://github.com/iojw/socialscan",
    acceptedInputs: ["email", "username"],
    defaultArgs: ["--json"],
    safety: {
      requiresConsent: true,
      publicDataOnly: true,
      notes: emailSafetyNotes,
    },
  },
  holehe: {
    id: "holehe",
    displayName: "Holehe",
    executable: "holehe",
    homepage: "https://github.com/megadose/holehe",
    acceptedInputs: ["email"],
    defaultArgs: ["--json"],
    safety: {
      requiresConsent: true,
      publicDataOnly: true,
      notes: emailSafetyNotes,
    },
  },
};

function hasAcceptedInput(config: ExternalToolConfig, subject: EnrichmentSubject): boolean {
  return config.acceptedInputs.some((input) => Boolean(subject[input]));
}

export function createExternalToolAdapter(config: ExternalToolConfig, runner?: ExternalToolRunner): PublicEnrichmentAdapter {
  return {
    id: `external-${config.id}`,
    name: config.displayName,
    description: `Configuration stub for running ${config.displayName} through an explicitly provided tool runner.`,
    safety: config.safety,
    canEnrich(subject) {
      return hasAcceptedInput(config, subject);
    },
    async enrich(subject, context?: EnrichmentAdapterContext, options?: EnrichmentRunOptions): Promise<EnrichmentResult> {
      if (!hasAcceptedInput(config, subject)) {
        return createSkippedResult(this, subject, `${config.displayName} requires ${config.acceptedInputs.join(" or ")}.`, context, options);
      }

      if (!runner) {
        const timestamp = createObservedAt(context, options);

        return {
          adapterId: this.id,
          status: "skipped",
          subject,
          signals: [],
          safety: this.safety,
          startedAt: timestamp,
          completedAt: timestamp,
          error: {
            message: `${config.displayName} is configured but no external tool runner has been provided.`,
            code: "external_runner_missing",
          },
          metadata: {
            executable: config.executable,
            defaultArgs: config.defaultArgs,
            homepage: config.homepage,
          },
        };
      }

      return runner(config, subject, options);
    },
  };
}

export const externalToolAdapters = Object.values(externalToolConfigs).map((config) => createExternalToolAdapter(config));
