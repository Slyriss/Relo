"use client";

import Link from "next/link";
import { BookOpen, ChevronDown, ChevronUp, ExternalLink, Send, Sparkles, ThumbsDown, ThumbsUp, UserCheck, UserPlus, X } from "lucide-react";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileAvatar } from "@/components/profile-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { buildApproachBrief } from "@/lib/approach-brief";
import { mockPrep } from "@/lib/ai/prep";
import { useAppStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";
import type { Attendee, MatchRecommendation } from "@/types";

export function MatchCard({ attendee, match, source, eventId, viewerId, feedback, onLike, onDislike, onDismiss }: {
  attendee: Attendee;
  match: MatchRecommendation;
  source?: Attendee;
  eventId?: string;
  viewerId?: string;
  feedback?: "liked" | "disliked" | null;
  onLike?: () => void;
  onDislike?: (reason?: string) => void;
  onDismiss?: (reason?: string) => void;
}) {
  const [bullets, setBullets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [prepError, setPrepError] = useState("");
  const [open, setOpen] = useState(false);

  // Sentiment popup state
  const [sentimentMode, setSentimentMode] = useState<"dislike" | "dismiss" | null>(null);
  const [sentimentText, setSentimentText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const meetingRequests   = useAppStore(useShallow((s) => s.meetingRequests));
  const event = useAppStore((s) => s.events.find((item) => item.id === (eventId ?? attendee.eventId) || item.slug === (eventId ?? attendee.eventId)));
  const addMeetingRequest = useAppStore((s) => s.addMeetingRequest);
  const removeMeetingRequest = useAppStore((s) => s.removeMeetingRequest);
  const checkIns          = useAppStore(useShallow((s) => s.checkIns));
  const activeViewerId = viewerId ?? source?.id ?? "att-1";

  const existingRequest = meetingRequests.find(
    (r) => r.requesterId === activeViewerId && r.targetId === attendee.id && r.eventId === (eventId ?? attendee.eventId)
  );
  const isConnected = !!existingRequest;
  const isHere = checkIns.some((c) => c.attendeeId === attendee.id && c.eventId === (eventId ?? attendee.eventId));
  const brief = source && event
    ? buildApproachBrief({ source, target: attendee, event, match, isHere })
    : null;

  function toggleConnect() {
    if (isConnected && existingRequest) {
      removeMeetingRequest(existingRequest.id);
    } else {
      addMeetingRequest({
        id: `req-${Date.now()}`,
        eventId: eventId ?? attendee.eventId,
        requesterId: activeViewerId,
        targetId: attendee.id,
        createdAt: new Date().toISOString(),
        status: "pending",
      });
    }
  }

  async function loadPrep() {
    if (bullets.length) return;
    const fallback = source
      ? mockPrep({ source, target: attendee })
      : [
          `${attendee.name} is ${attendee.title} at ${attendee.company}.`,
          `Ask what would make this event useful for their ${attendee.goals[0] ?? "learning"} goal.`,
          `Offer one concrete intro, insight, or follow-up instead of a broad pitch.`,
        ];
    setLoading(true);
    setPrepError("");
    try {
      if (!source) {
        setBullets(fallback);
        return;
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch("/api/prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, target: attendee }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = (await res.json()) as { bullets?: string[] };
      setBullets(data.bullets?.length ? data.bullets : fallback);
    } catch {
      setPrepError("Using local prep because live AI prep was slow.");
      setBullets(fallback);
    }
    finally { setLoading(false); }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) void loadPrep();
  }

  function openSentiment(mode: "dislike" | "dismiss") {
    setSentimentMode(mode);
    setSentimentText("");
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  function submitSentiment() {
    const reason = sentimentText.trim() || undefined;
    if (sentimentMode === "dislike") onDislike?.(reason);
    else onDismiss?.(reason);
    setSentimentMode(null);
    setSentimentText("");
  }

  function cancelSentiment() {
    setSentimentMode(null);
    setSentimentText("");
  }

  return (
    <Card className={cn("min-w-0", feedback === "liked" && "border-emerald-300 bg-emerald-50/30")}>
      <CardContent className="flex min-w-0 gap-4 pt-5">
        <div className="relative shrink-0">
          <ProfileAvatar name={attendee.name} photoUrl={attendee.photoUrl} className="h-12 w-12" />
          {isHere && (
            <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/events/${eventId ?? attendee.eventId}/people/${attendee.id}`}
                className="inline-flex min-h-10 max-w-full items-center break-words font-semibold hover:text-primary hover:underline"
              >
                {attendee.name}
              </Link>
              <p className="break-words text-sm text-muted-foreground">
                {attendee.title}, {attendee.company}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={toggleConnect}
                title={isConnected ? "Remove from my list" : "I want to meet this person"}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg transition",
                  isConnected
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-primary"
                )}
              >
                {isConnected ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
              </button>
              <Badge className="border-primary/30 text-primary">
                <Sparkles className="mr-1 h-3 w-3" />
                {match.score}
              </Badge>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {isHere ? <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Here now</Badge> : null}
            {match.why.map((why) => (
              <Badge key={why}>{why}</Badge>
            ))}
          </div>
          {brief ? (
            <div className="mt-3 grid gap-2 rounded-xl border bg-muted/30 p-3 text-sm">
              <p className="font-medium">{brief.bestAngle}</p>
              <p className="text-muted-foreground">{brief.suggestedAsk}</p>
            </div>
          ) : null}
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              {source ? (
                <Button size="sm" variant="ghost" className="min-h-10 px-2 text-xs text-muted-foreground" onClick={toggle}>
                  <BookOpen className="mr-1 h-3 w-3" />
                  Prep brief
                  {open ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
                </Button>
              ) : null}
              <Button asChild size="sm" variant="ghost" className="min-h-10 px-2 text-xs text-muted-foreground">
                <Link href={`/events/${eventId ?? attendee.eventId}/people/${attendee.id}`}>
                  Profile <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </div>

            {/* Feedback actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={onLike}
                title="Good match"
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg transition",
                  feedback === "liked"
                    ? "bg-emerald-100 text-emerald-700"
                    : "text-muted-foreground hover:bg-muted hover:text-emerald-600"
                )}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => openSentiment("dislike")}
                title="Not a good match"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-red-500"
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => openSentiment("dismiss")}
                title="Remove from view"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Sentiment popup */}
          {sentimentMode && (
            <div className="mt-2 space-y-2 rounded-xl border bg-background p-3 shadow-sm">
              <p className="text-xs font-medium text-muted-foreground">
                {sentimentMode === "dislike"
                  ? "What makes this a poor match? (optional)"
                  : "Why are you removing this? (optional)"}
              </p>
              <textarea
                ref={textareaRef}
                value={sentimentText}
                onChange={(e) => setSentimentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitSentiment(); } }}
                rows={2}
                placeholder={
                  sentimentMode === "dislike"
                    ? "e.g. Different industry, already know them…"
                    : "e.g. Already connected, not relevant right now…"
                }
                className="w-full resize-none rounded-lg border bg-muted/40 px-3 py-2 text-xs outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/30"
              />
              <div className="flex gap-2">
                <button
                  onClick={submitSentiment}
                  className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-background transition hover:bg-foreground/80"
                >
                  <Send className="h-3 w-3" />
                  {sentimentMode === "dislike" ? "Mark as poor match" : "Remove"}
                </button>
                <button
                  onClick={cancelSentiment}
                  className="min-h-10 rounded-lg border px-3 py-2 text-xs text-muted-foreground transition hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {open && !sentimentMode ? (
            <div className="mt-2 space-y-2 rounded-xl border bg-muted/40 p-3">
              {loading ? (
                <>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-4/6" />
                </>
              ) : (
                <ul className="space-y-1.5">
                  {bullets.map((b, i) => (
                    <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                      <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-primary/10 text-center text-[10px] font-semibold leading-4 text-primary">
                        {i + 1}
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
              {prepError ? <p className="text-[11px] text-muted-foreground">{prepError}</p> : null}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
