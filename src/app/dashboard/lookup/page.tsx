"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ExternalLink, Handshake, Loader2, Newspaper, Search, Target, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PersonEnrichment } from "@/lib/enrichment";
import type { NewsArticle } from "@/lib/news";

type LookupResponse = {
  enrichment: PersonEnrichment;
  news: NewsArticle[];
  connectionPlan: {
    headline: string;
    whyMeet: string;
    personalBridge: string;
    partnership: string;
    ask: string;
    offer: string;
    nextStep: string;
    risk: string;
  } | null;
  context: string | null;
};

type LookupForm = {
  viewerName: string;
  viewerTitle: string;
  viewerCompany: string;
  viewerGoal: string;
  viewerOffer: string;
  viewerBackground: string;
  sharedContext: string;
  name: string;
  email: string;
  company: string;
  title: string;
  linkedinUrl: string;
  industry: string;
  context: string;
  bio: string;
};

const initialForm: LookupForm = {
  viewerName: "John Tan",
  viewerTitle: "Founder",
  viewerCompany: "Relo",
  viewerGoal: "At this event, find pilot users, event partners, and people who can stress-test relationship intelligence for live events.",
  viewerOffer: "a free pilot that turns an event signup list into ranked intros, talking points, and follow-up actions",
  viewerBackground: "Founder of Relo building relationship intelligence for events, starting with manual concierge-style recommendations.",
  sharedContext: "Both are in Singapore startup circles. Use founder and education/product interest as the first bridge; mention shared school only if the user adds it here.",
  name: "Lee Yang Sean",
  email: "lee.yang.sean@example.com",
  company: "Jalan Journey",
  title: "EdTech startup builder",
  linkedinUrl: "https://sg.linkedin.com/in/leeyangsean",
  industry: "EdTech",
  context: "Edutech Startup event in Singapore",
  bio: "NUS Information Systems student connected to Singapore startup, product, UX, community, and education technology circles.",
};

const charisseSample: LookupForm = {
  ...initialForm,
  name: "Charisse Li",
  email: "charisse.li@example.com",
  company: "Manus AI",
  title: "AI product / growth",
  linkedinUrl: "",
  industry: "AI Agents",
  context: "AI startup and founder networking event",
  bio: "Use public context only. Validate current role and company details before treating this as confirmed.",
  sharedContext: "John is building Relo for high-signal event networking. Manus AI is relevant because AI-native teams need fast relationship mapping, customer discovery, and partner follow-up.",
};

function displayDate(value?: string) {
  if (!value) return "";
  const gdeltMatch = value.match(/^(\d{4})(\d{2})(\d{2})/);
  if (gdeltMatch) return `${gdeltMatch[1]}-${gdeltMatch[2]}-${gdeltMatch[3]}`;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function conversationAngles(enrichment?: PersonEnrichment, news: NewsArticle[] = [], context?: string) {
  const angles = [
    enrichment?.likelyFocus ? `Ask how they are approaching ${enrichment.likelyFocus.toLowerCase()}.` : "",
    context ? `Connect it back to ${context}.` : "",
    news[0]?.title ? `Use this current article as a timely opener: ${news[0].title}.` : "",
    enrichment?.industry ? `Offer a useful contact, pilot user, or market note in ${enrichment.industry}.` : "",
  ];

  return angles.filter(Boolean);
}

function fallbackAngles(result: LookupResponse | null, form: LookupForm) {
  if (!result) return [];
  if (result.connectionPlan) {
    return [
      result.connectionPlan.ask,
      result.connectionPlan.offer,
      result.connectionPlan.personalBridge,
      result.connectionPlan.nextStep,
      result.connectionPlan.risk,
    ];
  }

  return conversationAngles(result.enrichment, result.news, form.context);
}

export default function LookupPage() {
  const [form, setForm] = useState<LookupForm>(initialForm);
  const [result, setResult] = useState<LookupResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const angles = fallbackAngles(result, form);

  function updateField(field: keyof LookupForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function runLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: form.context,
          viewer: {
            name: form.viewerName,
            title: form.viewerTitle,
            company: form.viewerCompany,
            goal: form.viewerGoal,
            offer: form.viewerOffer,
            background: form.viewerBackground,
          },
          sharedContext: form.sharedContext,
          attendee: {
            id: `manual-${form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "lookup"}`,
            eventId: "manual-lookup",
            name: form.name,
            email: form.email,
            company: form.company,
            title: form.title,
            linkedinUrl: form.linkedinUrl || undefined,
            bio: form.bio,
            headline: form.title,
            goals: ["partnerships", "customers", "learning"],
            industry: form.industry,
            profileComplete: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Lookup failed. Check the name, email, and public URL fields.");
      }

      setResult((await response.json()) as LookupResponse);
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : "Lookup failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Manual People Lookup</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Test public enrichment, recommendation context, and recent industry material before we bind it to event-only access rules.
          </p>
        </div>
        <Badge className="w-fit bg-muted">Manual test mode</Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Lookup input</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => setForm(charisseSample)}>
                Load Charisse sample
              </Button>
            </div>
            <CardDescription>Start with a name and add whatever public context you have.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={runLookup}>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="mb-3 text-sm font-semibold">You</p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <label className="space-y-1.5 text-sm font-medium">
                    Your name
                    <Input value={form.viewerName} onChange={(event) => updateField("viewerName", event.target.value)} />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium">
                    Your role
                    <Input value={form.viewerTitle} onChange={(event) => updateField("viewerTitle", event.target.value)} />
                  </label>
                </div>
                <label className="mt-3 block space-y-1.5 text-sm font-medium">
                  Your company
                  <Input value={form.viewerCompany} onChange={(event) => updateField("viewerCompany", event.target.value)} />
                </label>
                <label className="mt-3 block space-y-1.5 text-sm font-medium">
                  What you want from this event
                  <Textarea value={form.viewerGoal} onChange={(event) => updateField("viewerGoal", event.target.value)} rows={3} />
                </label>
                <label className="mt-3 block space-y-1.5 text-sm font-medium">
                  What you can offer at this event
                  <Textarea value={form.viewerOffer} onChange={(event) => updateField("viewerOffer", event.target.value)} rows={3} />
                </label>
                <label className="mt-3 block space-y-1.5 text-sm font-medium">
                  Your background
                  <Textarea value={form.viewerBackground} onChange={(event) => updateField("viewerBackground", event.target.value)} rows={3} />
                </label>
                <label className="mt-3 block space-y-1.5 text-sm font-medium">
                  Shared context
                  <Textarea
                    value={form.sharedContext}
                    onChange={(event) => updateField("sharedContext", event.target.value)}
                    rows={3}
                    placeholder="Same school, same city, founder experience, mutual community, shared customer segment..."
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <label className="space-y-1.5 text-sm font-medium">
                  Name
                  <Input value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  Email
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    required
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <label className="space-y-1.5 text-sm font-medium">
                  Company
                  <Input value={form.company} onChange={(event) => updateField("company", event.target.value)} />
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  Title
                  <Input value={form.title} onChange={(event) => updateField("title", event.target.value)} />
                </label>
              </div>

              <label className="space-y-1.5 text-sm font-medium">
                Public profile URL
                <Input
                  value={form.linkedinUrl}
                  onChange={(event) => updateField("linkedinUrl", event.target.value)}
                  placeholder="https://..."
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium">
                Industry
                <Input value={form.industry} onChange={(event) => updateField("industry", event.target.value)} />
              </label>

              <label className="space-y-1.5 text-sm font-medium">
                Event context
                <Input value={form.context} onChange={(event) => updateField("context", event.target.value)} />
              </label>

              <label className="space-y-1.5 text-sm font-medium">
                Notes
                <Textarea value={form.bio} onChange={(event) => updateField("bio", event.target.value)} rows={4} />
              </label>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Run lookup
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Handshake className="h-4 w-4 text-primary" />
                <CardTitle>Why this meeting matters</CardTitle>
              </div>
              <CardDescription>Specific benefit and partnership logic for the person doing the outreach.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {result ? (
                <>
                  {result.connectionPlan ? (
                    <div className="rounded-lg border bg-primary/5 p-4">
                      <p className="text-sm font-semibold">{result.connectionPlan.headline}</p>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Benefit</p>
                          <p className="mt-1 text-sm">{result.connectionPlan.whyMeet}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-muted-foreground">Partnership opportunity</p>
                          <p className="mt-1 text-sm">{result.connectionPlan.partnership}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-xs font-medium uppercase text-muted-foreground">Personal bridge</p>
                          <p className="mt-1 text-sm">{result.connectionPlan.personalBridge}</p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Confidence</p>
                      <p className="mt-1 text-2xl font-semibold">{Math.round(result.enrichment.confidence * 100)}%</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Industry</p>
                      <p className="mt-1 text-sm font-medium">{result.enrichment.industry || form.industry || "Unknown"}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Focus</p>
                      <p className="mt-1 text-sm font-medium">{result.enrichment.likelyFocus || "Public context review"}</p>
                    </div>
                  </div>

                  <div>
                    <h2 className="flex items-center gap-2 text-sm font-semibold">
                      <Target className="h-4 w-4" />
                      Conversation plan
                    </h2>
                    <div className="mt-3 grid gap-2">
                      {angles.map((angle) => (
                        <div key={angle} className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                          {angle}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 className="flex items-center gap-2 text-sm font-semibold">
                      <Users className="h-4 w-4" />
                      Public signals
                    </h2>
                    <div className="mt-3 grid gap-2">
                      {result.enrichment.signals.map((signal) => (
                        <div key={`${signal.source}-${signal.label}`} className="rounded-lg border px-3 py-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge>{signal.source}</Badge>
                            <span className="text-sm font-medium">{signal.label}</span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{signal.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {result.enrichment.publicProfileUrl ? (
                    <Button asChild variant="outline">
                      <Link href={result.enrichment.publicProfileUrl} target="_blank" rel="noreferrer">
                        Open public profile
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  ) : null}
                </>
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                  Run the lookup to see why John Tan, founder of Relo, should talk to this person and what partnership path to test.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Newspaper className="h-4 w-4 text-primary" />
                <CardTitle>Recent industry material</CardTitle>
              </div>
              <CardDescription>Articles are queried from public news coverage using the company, industry, and event context.</CardDescription>
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
                  Run a lookup to pull recent public articles. If the news API has no matching coverage, this panel will stay empty.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
