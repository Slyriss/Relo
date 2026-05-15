"use client";

import { Loader2, Sparkles, UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";
import { slugify } from "@/lib/utils";
import type { Attendee } from "@/types";

export function ProfilePasteImport({ eventId }: { eventId: string }) {
  const addAttendees = useAppStore((s) => s.addAttendees);
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<Partial<Attendee> | null>(null);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  async function handleParse() {
    if (!text.trim()) return;
    setLoading(true);
    setParsed(null);
    setAdded(false);
    try {
      const res = await fetch("/api/profile-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      const data = (await res.json()) as { profile?: Partial<Attendee> };
      setParsed(data.profile ?? {});
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function handleAdd() {
    if (!parsed) return;
    const email = parsed.email ?? `import-${Date.now()}@relo.app`;
    const attendee: Attendee = {
      id: `att-paste-${slugify(email)}-${Date.now()}`,
      eventId,
      name: parsed.name ?? "Unknown",
      email,
      company: parsed.company ?? "",
      title: parsed.title ?? "",
      bio: parsed.bio ?? text.slice(0, 120),
      headline: parsed.bio ?? text.slice(0, 120),
      photoUrl: parsed.photoUrl,
      goals: parsed.goals?.length ? parsed.goals : ["learning"],
      industry: parsed.industry,
      seniority: parsed.seniority,
      profileComplete: Boolean(parsed.name && parsed.company && parsed.bio)
    };
    await addAttendees([attendee]);
    setAdded(true);
    setText("");
    setParsed(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          Attendee import from text
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Paste attendee-provided bio text, a resume snippet, or approved public profile text. AI extracts event goals, industry, and seniority for review.
        </p>
        <Textarea
          placeholder="Paste attendee bio or approved profile text here..."
          rows={5}
          value={text}
          onChange={(e) => { setText(e.target.value); setParsed(null); setAdded(false); }}
        />
        <Button onClick={handleParse} disabled={!text.trim() || loading} size="sm">
          {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
          {loading ? "Parsing…" : "Parse with AI"}
        </Button>

        {parsed ? (
          <div className="rounded-xl border bg-muted/40 p-4 text-sm space-y-1.5">
            <div className="font-semibold">{parsed.name ?? "—"}</div>
            <div className="text-muted-foreground">{parsed.title}{parsed.company ? `, ${parsed.company}` : ""}</div>
            {parsed.bio ? <p className="text-muted-foreground">{parsed.bio}</p> : null}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {parsed.goals?.map((g) => (
                <span key={g} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{g}</span>
              ))}
              {parsed.industry ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{parsed.industry}</span>
              ) : null}
              {parsed.seniority ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">L{parsed.seniority}</span>
              ) : null}
            </div>
            <Button size="sm" className="mt-2" onClick={handleAdd}>
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              Add to event
            </Button>
          </div>
        ) : null}

        {added ? (
          <p className="text-sm font-medium text-green-600">Attendee added to event.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
