"use client";

import { create } from "zustand";
import type { ResearchBrief } from "@/lib/ai/provider";
import type { PersonEnrichment } from "@/lib/enrichment";
import type { NewsArticle } from "@/lib/news";
import type { ResearchSource } from "@/lib/research";

export type LookupResponse = {
  enrichment: PersonEnrichment;
  news: NewsArticle[];
  researchBrief: ResearchBrief;
  sources: ResearchSource[];
  sourceStatus: string;
  sourceProvider: "multi" | "tinyfish" | "brave" | "submitted-only";
  context: string | null;
};

export type LookupForm = {
  name: string;
  email: string;
  company: string;
  title: string;
  linkedinUrl: string;
  industry: string;
  context: string;
  researchQuestion: string;
  bio: string;
};

type LookupResearchState = {
  form: LookupForm;
  result: LookupResponse | null;
  error: string;
  loading: boolean;
  activeQuery: string;
  jobId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  updateField: (field: keyof LookupForm, value: string) => void;
  runLookup: () => Promise<void>;
  resetResearch: () => void;
};

const STORAGE_KEY = "relo.lookupResearch.v1";

export const initialLookupForm: LookupForm = {
  name: "",
  email: "",
  company: "",
  title: "",
  linkedinUrl: "",
  industry: "",
  context: "",
  researchQuestion: "",
  bio: "",
};

function fallbackEmail(name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "target";
  return `research-${slug}@relo.local`;
}

function readCachedResearch() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "null") as
      | Pick<LookupResearchState, "form" | "result" | "completedAt">
      | null;
  } catch {
    return null;
  }
}

function cacheResearch(snapshot: Pick<LookupResearchState, "form" | "result" | "completedAt">) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

function researchPayload(form: LookupForm) {
  return {
    context: form.context || undefined,
    researchQuestion: form.researchQuestion || undefined,
    attendee: {
      id: `manual-${form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "lookup"}`,
      eventId: "manual-lookup",
      name: form.name,
      email: form.email || fallbackEmail(form.name),
      company: form.company,
      title: form.title,
      linkedinUrl: form.linkedinUrl || undefined,
      bio: form.bio,
      headline: form.title,
      goals: ["learning"],
      industry: form.industry || undefined,
      profileComplete: true,
    },
  };
}

let activeRequestId = 0;

export const useLookupResearchStore = create<LookupResearchState>((set, get) => {
  const cached = readCachedResearch();

  return {
    form: cached?.form ?? initialLookupForm,
    result: cached?.result ?? null,
    error: "",
    loading: false,
    activeQuery: "",
    jobId: null,
    startedAt: null,
    completedAt: cached?.completedAt ?? null,
    updateField: (field, value) => set((state) => ({ form: { ...state.form, [field]: value } })),
    resetResearch: () => {
      set({ result: null, error: "", completedAt: null, jobId: null });
      if (typeof window !== "undefined") window.sessionStorage.removeItem(STORAGE_KEY);
    },
    runLookup: async () => {
      const form = get().form;
      const requestId = activeRequestId + 1;
      activeRequestId = requestId;

      set({
        loading: true,
        error: "",
        result: null,
        jobId: null,
        startedAt: new Date().toISOString(),
        completedAt: null,
        activeQuery: [form.name, form.company, form.title].filter(Boolean).join(" - "),
      });

      try {
        const startResponse = await fetch("/api/lookup/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(researchPayload(form)),
        });

        if (!startResponse.ok) {
          throw new Error("Research failed. Check the target name, optional URL, and public context fields.");
        }

        const startedJob = (await startResponse.json()) as { id: string; status: "running"; label: string };
        if (requestId !== activeRequestId) return;
        set({ jobId: startedJob.id, activeQuery: startedJob.label || get().activeQuery });

        let result: LookupResponse | null = null;
        for (;;) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          if (requestId !== activeRequestId) return;

          const jobResponse = await fetch(`/api/lookup/jobs/${startedJob.id}`, { cache: "no-store" });
          if (!jobResponse.ok) throw new Error("Could not check research progress.");
          const job = (await jobResponse.json()) as
            | { status: "running" }
            | { status: "completed"; result: LookupResponse }
            | { status: "failed"; error: string };

          if (job.status === "running") continue;
          if (job.status === "failed") throw new Error(job.error || "Research failed.");
          result = job.result;
          break;
        }

        const completedAt = new Date().toISOString();
        set({ result, completedAt, jobId: null });
        cacheResearch({ form, result, completedAt });
      } catch (lookupError) {
        if (requestId !== activeRequestId) return;
        set({ error: lookupError instanceof Error ? lookupError.message : "Research failed.", jobId: null });
      } finally {
        if (requestId === activeRequestId) set({ loading: false });
      }
    },
  };
});
