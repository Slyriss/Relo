import { randomUUID } from "crypto";
import { runLookupResearch, type LookupInput } from "@/lib/lookup-research";

export type LookupResearchJob =
  | {
      id: string;
      status: "running";
      createdAt: string;
      updatedAt: string;
      label: string;
    }
  | {
      id: string;
      status: "completed";
      createdAt: string;
      updatedAt: string;
      label: string;
      result: Awaited<ReturnType<typeof runLookupResearch>>;
    }
  | {
      id: string;
      status: "failed";
      createdAt: string;
      updatedAt: string;
      label: string;
      error: string;
    };

const globalJobs = globalThis as typeof globalThis & {
  __reloLookupResearchJobs?: Map<string, LookupResearchJob>;
};

const jobs = globalJobs.__reloLookupResearchJobs ?? new Map<string, LookupResearchJob>();
globalJobs.__reloLookupResearchJobs = jobs;

function labelFor(input: LookupInput) {
  return [input.attendee.name, input.attendee.company, input.attendee.title].filter(Boolean).join(" - ");
}

export function createLookupResearchJob(input: LookupInput) {
  const now = new Date().toISOString();
  const job: LookupResearchJob = {
    id: randomUUID(),
    status: "running",
    createdAt: now,
    updatedAt: now,
    label: labelFor(input),
  };

  jobs.set(job.id, job);

  void runLookupResearch(input)
    .then((result) => {
      const current = jobs.get(job.id);
      jobs.set(job.id, {
        id: job.id,
        status: "completed",
        createdAt: current?.createdAt ?? now,
        updatedAt: new Date().toISOString(),
        label: current?.label ?? job.label,
        result,
      });
    })
    .catch((error) => {
      const current = jobs.get(job.id);
      jobs.set(job.id, {
        id: job.id,
        status: "failed",
        createdAt: current?.createdAt ?? now,
        updatedAt: new Date().toISOString(),
        label: current?.label ?? job.label,
        error: error instanceof Error ? error.message : "Research failed.",
      });
    });

  return job;
}

export function getLookupResearchJob(id: string) {
  return jobs.get(id) ?? null;
}
