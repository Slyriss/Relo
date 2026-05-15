"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { BrainCircuit, ExternalLink, FileSearch, Globe2, Linkedin, Loader2, Newspaper, Search, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ResearchBrief } from "@/lib/ai/provider";
import type { PersonEnrichment } from "@/lib/enrichment";
import type { NewsArticle } from "@/lib/news";
import type { ResearchSource } from "@/lib/research";
import { cn } from "@/lib/utils";

type LookupResponse = {
  enrichment: PersonEnrichment;
  news: NewsArticle[];
  researchBrief: ResearchBrief;
  sources: ResearchSource[];
  sourceStatus: string;
  sourceProvider: "multi" | "tinyfish" | "brave" | "submitted-only";
  context: string | null;
};

type LookupForm = {
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

const initialForm: LookupForm = {
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

function displayDate(value?: string) {
  if (!value) return "";
  const gdeltMatch = value.match(/^(\d{4})(\d{2})(\d{2})/);
  if (gdeltMatch) return `${gdeltMatch[1]}-${gdeltMatch[2]}-${gdeltMatch[3]}`;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function sourceIcon(type: ResearchSource["type"]) {
  if (type === "linkedin") return Linkedin;
  if (type === "news") return Newspaper;
  return Globe2;
}

function fallbackEmail(name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "target";
  return `research-${slug}@relo.local`;
}

function ResearchAnimation() {
  return (
    <div className="rounded-xl border bg-primary/5 p-5">
      <div className="flex items-center gap-3">
        <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <BrainCircuit className="h-5 w-5" />
          <span className="absolute inset-0 animate-ping rounded-xl bg-primary/30" />
        </span>
        <div>
          <p className="font-semibold">Researching public sources</p>
          <p className="text-sm text-muted-foreground">Searching, reading source titles, then asking DeepSeek to synthesize the brief.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-2">
        {["Finding target sources", "Checking recent public articles", "Writing admin intelligence brief"].map((step, index) => (
          <div key={step} className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2 text-sm">
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full bg-primary",
                index === 1 && "animation-delay-150",
                index === 2 && "animation-delay-300"
              )}
            />
            <span>{step}</span>
            <span className="ml-auto flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/70" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/70 [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/70 [animation-delay:240ms]" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LookupPage() {
  const [form, setForm] = useState<LookupForm>(initialForm);
  const [result, setResult] = useState<LookupResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field: keyof LookupForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function runLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
      });

      if (!response.ok) {
        throw new Error("Research failed. Check the target name, optional URL, and public context fields.");
      }

      setResult((await response.json()) as LookupResponse);
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : "Research failed.");
    } finally {
      setLoading(false);
    }
  }

  const linkedInSource = result?.sources.find((source) => source.type === "linkedin" && source.verified);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Research desk</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Query a person, company, or event context and turn live public sources into an admin intelligence brief.
          </p>
        </div>
        <Badge className="w-fit bg-emerald-50 text-emerald-700">Admin research</Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Target query</CardTitle>
            <CardDescription>Start with the person you want to investigate. Add a LinkedIn URL only when you already have the real profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={runLookup}>
              <label className="space-y-1.5 text-sm font-medium">
                Person name
                <Input value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
              </label>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <label className="space-y-1.5 text-sm font-medium">
                  Company
                  <Input value={form.company} onChange={(event) => updateField("company", event.target.value)} />
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  Role
                  <Input value={form.title} onChange={(event) => updateField("title", event.target.value)} />
                </label>
              </div>

              <label className="space-y-1.5 text-sm font-medium">
                LinkedIn URL
                <Input
                  value={form.linkedinUrl}
                  onChange={(event) => updateField("linkedinUrl", event.target.value)}
                  placeholder="https://www.linkedin.com/in/..."
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <label className="space-y-1.5 text-sm font-medium">
                  Industry or market
                  <Input value={form.industry} onChange={(event) => updateField("industry", event.target.value)} />
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  Email, if available
                  <Input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
                </label>
              </div>

              <label className="space-y-1.5 text-sm font-medium">
                Event or research context
                <Textarea
                  value={form.context}
                  onChange={(event) => updateField("context", event.target.value)}
                  rows={3}
                  placeholder="Event name, market, geography, speaker list, reason this target matters..."
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium">
                What should the research answer?
                <Textarea
                  value={form.researchQuestion}
                  onChange={(event) => updateField("researchQuestion", event.target.value)}
                  rows={3}
                  placeholder="Example: verify current role, find recent articles, identify useful event angle..."
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium">
                Notes from signup or import
                <Textarea value={form.bio} onChange={(event) => updateField("bio", event.target.value)} rows={4} />
              </label>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {loading ? "Researching" : "Run research"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileSearch className="h-4 w-4 text-primary" />
                <CardTitle>Target intelligence</CardTitle>
              </div>
              <CardDescription>DeepSeek synthesis over the source set returned by the live source providers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {loading ? <ResearchAnimation /> : null}

              {!loading && result ? (
                <>
                  <div className="rounded-xl border bg-primary/5 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold">Research brief</p>
                      <Badge className="bg-background">{Math.round(result.enrichment.confidence * 100)}% source confidence</Badge>
                    </div>
                    <p className="mt-3 text-sm leading-6">{result.researchBrief.summary}</p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">LinkedIn</p>
                      <p className="mt-1 text-sm font-semibold">{linkedInSource ? "Verified URL" : "Not verified"}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Articles</p>
                      <p className="mt-1 text-sm font-semibold">{result.news.length} returned</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Source provider</p>
                      <p className="mt-1 text-sm font-semibold">
                        {result.sourceProvider === "multi"
                          ? "TinyFish + Brave"
                          : result.sourceProvider === "tinyfish"
                            ? "TinyFish live search"
                            : result.sourceProvider === "brave"
                              ? "Brave Search"
                              : "Submitted + news index"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold">Findings</h2>
                    <div className="mt-3 grid gap-2">
                      {result.researchBrief.findings.map((finding) => (
                        <div key={finding} className="rounded-lg border bg-muted/25 px-3 py-2 text-sm leading-6">
                          {finding}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold">Source notes</h2>
                    <div className="mt-3 grid gap-2">
                      {result.researchBrief.sourceNotes.map((note) => (
                        <div key={note} className="rounded-lg border px-3 py-2 text-sm text-muted-foreground">
                          {note}
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">{result.sourceStatus}</p>
                  </div>
                </>
              ) : null}

              {!loading && !result ? (
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                  Run a target query to generate an admin research brief. The page will show only submitted or live public sources, not fabricated profile links.
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-primary" />
                <CardTitle>Public sources</CardTitle>
              </div>
              <CardDescription>Actual URLs returned by submitted profile data, live search, or public news indexes.</CardDescription>
            </CardHeader>
            <CardContent>
              {result?.sources.length ? (
                <div className="space-y-3">
                  {result.sources.map((source) => {
                    const Icon = sourceIcon(source.type);
                    return (
                      <Link
                        key={`${source.type}-${source.url}`}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-lg border p-3 transition hover:bg-muted/40"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="break-words text-sm font-medium text-foreground">{source.title}</p>
                              <Badge className={source.verified ? "bg-emerald-50 text-emerald-700" : "bg-muted"}>
                                {source.verified ? "source" : "candidate"}
                              </Badge>
                            </div>
                            <p className="mt-1 break-words text-xs text-muted-foreground">{source.source}</p>
                            {source.snippet ? <p className="mt-2 text-xs leading-5 text-muted-foreground">{source.snippet}</p> : null}
                            {source.excerpt ? <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">{source.excerpt}</p> : null}
                          </div>
                          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                  No sources yet. Run research with a real LinkedIn URL or configure live source search to resolve public pages.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Newspaper className="h-4 w-4 text-primary" />
                <CardTitle>Recent articles</CardTitle>
              </div>
              <CardDescription>Live article results from the configured public news source.</CardDescription>
            </CardHeader>
            <CardContent>
              {result?.news.length ? (
                <div className="space-y-3">
                  {result.news.map((article) => (
                    <Link
                      key={article.url}
                      href={article.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-lg border p-3 transition hover:bg-muted/40"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{article.source}</span>
                        {article.publishedAt ? <span>{displayDate(article.publishedAt)}</span> : null}
                      </div>
                      <p className="mt-1 text-sm font-medium text-foreground">{article.title}</p>
                      {article.snippet ? <p className="mt-1 text-xs text-muted-foreground">{article.snippet}</p> : null}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                  No recent articles returned yet. DeepSeek can summarize articles after a source provider returns them, but it is not a news search engine by itself.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
