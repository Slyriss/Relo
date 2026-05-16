"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileAvatar } from "@/components/profile-avatar";
import { useAppStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { cn, sanitizeDisplayText } from "@/lib/utils";
import { GOAL_COLOR } from "@/lib/graph";

type Strength = "strong" | "regular" | "new";

type Contact = {
  email: string;
  name: string;
  company: string;
  title: string;
  linkedinUrl?: string;
  photoUrl?: string;
  goals: string[];
  meetingCount: number;
  eventsTogether: number;
  lastMetAt: string;
  lastEventTitle: string;
  latestNote: string;
  strength: Strength;
};

function strength(meetingCount: number): Strength {
  if (meetingCount >= 3) return "strong";
  if (meetingCount >= 2) return "regular";
  return "new";
}

const STRENGTH_CONFIG: Record<Strength, { label: string; dot: string; badge: string }> = {
  strong:  { label: "Strong",  dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700" },
  regular: { label: "Regular", dot: "bg-primary",     badge: "bg-primary/10 text-primary"    },
  new:     { label: "New",     dot: "bg-muted-foreground/40", badge: "bg-muted text-muted-foreground" },
};

export default function ContactsPage() {
  const allAttendees    = useAppStore(useShallow((s) => s.attendees));
  const allMeetings     = useAppStore(useShallow((s) => s.meetings));
  const allEvents       = useAppStore(useShallow((s) => s.events));

  const [query,  setQuery]  = useState("");
  const [filter, setFilter] = useState<Strength | "all">("all");

  const contacts = useMemo<Contact[]>(() => {
    const byEmail = new Map<string, { meetings: typeof allMeetings; attendees: typeof allAttendees }>();

    for (const attendee of allAttendees) {
      if (!byEmail.has(attendee.email)) byEmail.set(attendee.email, { meetings: [], attendees: [] });
      byEmail.get(attendee.email)!.attendees.push(attendee);
    }

    for (const entry of byEmail.values()) {
      const ids = new Set(entry.attendees.map((attendee) => attendee.id));
      entry.meetings = allMeetings.filter((meeting) => ids.has(meeting.attendeeAId) || ids.has(meeting.attendeeBId));
    }

    return Array.from(byEmail.entries()).map(([email, { meetings, attendees }]) => {
      const latest    = meetings.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const lastMeeting = latest[0];
      const rep       = attendees[0]; // most recent record
      const lastEvent = lastMeeting ? allEvents.find((e) => e.id === lastMeeting.eventId) : undefined;
      const attendedEvent = allEvents.find((e) => e.id === rep.eventId);
      const eventIds  = new Set([...meetings.map((m) => m.eventId), ...attendees.map((a) => a.eventId)]);

      return {
        email,
        name:       sanitizeDisplayText(rep.name, "Contact needs review"),
        company:    sanitizeDisplayText(rep.company, "Company needs review"),
        title:      sanitizeDisplayText(rep.title, "Title needs review"),
        linkedinUrl: rep.linkedinUrl,
        photoUrl: rep.photoUrl,
        goals:      rep.goals,
        meetingCount: meetings.length,
        eventsTogether: eventIds.size,
        lastMetAt:  lastMeeting?.createdAt ?? attendedEvent?.startsAt ?? new Date(0).toISOString(),
        lastEventTitle: sanitizeDisplayText(lastEvent?.title ?? attendedEvent?.title ?? "No meetings logged", "Event needs review"),
        latestNote: lastMeeting?.note ? sanitizeDisplayText(lastMeeting.note, "Meeting note needs review") : "",
        strength:   strength(meetings.length),
      };
    }).sort((a, b) => b.meetingCount - a.meetingCount || b.lastMetAt.localeCompare(a.lastMetAt));
  }, [allAttendees, allMeetings, allEvents]);

  const filtered = useMemo(() => {
    let list = contacts;
    if (filter !== "all") list = list.filter((c) => c.strength === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q)
      );
    }
    return list;
  }, [contacts, filter, query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">CRM Network</h1>
        <p className="mt-1 text-muted-foreground">
          Attendee relationship history across all events, with context and follow-up status.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {(["strong", "regular", "new"] as Strength[]).map((s) => {
          const count = contacts.filter((c) => c.strength === s).length;
          const cfg = STRENGTH_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() => setFilter(filter === s ? "all" : s)}
              className={cn(
                "rounded-xl border p-4 text-left transition",
                filter === s ? "border-primary bg-primary/5" : "bg-background hover:bg-muted/40"
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", cfg.dot)} />
                <span className="text-sm font-medium">{cfg.label}</span>
              </div>
              <p className="mt-1 text-2xl font-bold">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or company…"
          className="h-10 w-full rounded-xl border bg-background pl-9 pr-9 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Contact list */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No contacts match.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const cfg = STRENGTH_CONFIG[c.strength];
            const color = GOAL_COLOR[c.goals[0]] ?? "#94a3b8";
            const relativeDate = new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
              Math.round((new Date(c.lastMetAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)),
              "month"
            );

            return (
              <Card key={c.email} className="transition hover:border-primary/30">
                <CardContent className="flex gap-4 pt-5 pb-4">
                  {/* Avatar */}
                  <ProfileAvatar name={c.name} photoUrl={c.photoUrl} className="h-11 w-11 text-sm text-white" style={{ background: color }} />

                  <div className="min-w-0 flex-1 space-y-2">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{c.name}</p>
                        <p className="text-sm text-muted-foreground">{c.title} · {c.company}</p>
                      </div>
                      <span className={cn("shrink-0 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", cfg.badge)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                        {cfg.label}
                      </span>
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {c.meetingCount} {c.meetingCount === 1 ? "meeting" : "meetings"}
                        {c.eventsTogether > 1 ? ` across ${c.eventsTogether} events` : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {c.meetingCount > 0 ? "Last met" : "Seen"} {relativeDate} · {c.lastEventTitle}
                      </span>
                    </div>

                    {/* Latest note */}
                    {c.latestNote && (
                      <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground line-clamp-2">
                        &ldquo;{c.latestNote}&rdquo;
                      </p>
                    )}

                    {/* Goals */}
                    <div className="flex flex-wrap gap-1.5">
                      {c.goals.map((g) => (
                        <span
                          key={g}
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                          style={{ background: GOAL_COLOR[g] ?? "#94a3b8" }}
                        >
                          {g}
                        </span>
                      ))}
                      {c.linkedinUrl && (
                        <a
                          href={c.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-xs text-primary hover:underline"
                        >
                          LinkedIn →
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
