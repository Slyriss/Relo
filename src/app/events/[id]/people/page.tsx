"use client";

import Link from "next/link";
import { Bell, ChevronRight, List, Search, UserCheck, UserPlus, X } from "lucide-react";
import { useMemo, useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { initials, cn } from "@/lib/utils";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@/lib/store";
import type { Goal } from "@/types";

const VIEWER_ID = "att-1";

type Tab = "browse" | "pokes" | "mylist";

export default function PeoplePage({ params }: { params: { id: string } }) {
  const attendees = useAppStore(useShallow((state) => state.attendees.filter((attendee) => attendee.eventId === params.id)));
  const meetingRequests = useAppStore(useShallow((s) => s.meetingRequests.filter((r) => r.eventId === params.id)));
  const addMeetingRequest = useAppStore((s) => s.addMeetingRequest);
  const removeMeetingRequest = useAppStore((s) => s.removeMeetingRequest);

  const [tab, setTab] = useState<Tab>("browse");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [goal, setGoal] = useState("all");
  const [company, setCompany] = useState("all");
  const [industry, setIndustry] = useState("all");
  const [dismissedPokes, setDismissedPokes] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  function closeSearch() {
    setQuery("");
    setSearchOpen(false);
  }

  // Incoming pokes: others → viewer
  const incomingPokes = useMemo(
    () => meetingRequests.filter((r) => r.targetId === VIEWER_ID && r.status === "pending" && !dismissedPokes.has(r.id)),
    [meetingRequests, dismissedPokes]
  );

  // Outgoing list: viewer → others
  const myList = useMemo(
    () => meetingRequests.filter((r) => r.requesterId === VIEWER_ID),
    [meetingRequests]
  );

  function waveBack(requesterId: string) {
    const alreadySent = meetingRequests.some(
      (r) => r.requesterId === VIEWER_ID && r.targetId === requesterId && r.eventId === params.id
    );
    if (!alreadySent) {
      addMeetingRequest({
        id: `req-${Date.now()}`,
        eventId: params.id,
        requesterId: VIEWER_ID,
        targetId: requesterId,
        createdAt: new Date().toISOString(),
        status: "pending",
      });
    }
  }

  function toggleConnect(targetId: string) {
    const existing = meetingRequests.find(
      (r) => r.requesterId === VIEWER_ID && r.targetId === targetId && r.eventId === params.id
    );
    if (existing) {
      removeMeetingRequest(existing.id);
    } else {
      addMeetingRequest({
        id: `req-${Date.now()}`,
        eventId: params.id,
        requesterId: VIEWER_ID,
        targetId,
        createdAt: new Date().toISOString(),
        status: "pending",
      });
    }
  }

  const goals: Array<Goal | "all"> = ["all", "fundraising", "hiring", "partnerships", "customers", "learning"];
  const companies = useMemo(() => ["all", ...Array.from(new Set(attendees.map((a) => a.company))).sort()], [attendees]);
  const industries = useMemo(
    () => ["all", ...Array.from(new Set(attendees.map((a) => a.industry).filter(Boolean))).sort()],
    [attendees]
  );
  const filteredAttendees = useMemo(() => {
    const q = query.trim().toLowerCase();
    return attendees.filter((a) => {
      const matchesQuery = !q || [a.name, a.company, a.title, a.bio, a.industry].filter(Boolean).some((v) => v!.toLowerCase().includes(q));
      const matchesGoal = goal === "all" || a.goals.includes(goal as Goal);
      const matchesCompany = company === "all" || a.company === company;
      const matchesIndustry = industry === "all" || a.industry === industry;
      return matchesQuery && matchesGoal && matchesCompany && matchesIndustry;
    });
  }, [attendees, company, goal, industry, query]);

  const tabs: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { key: "browse", label: "Browse", icon: List },
    { key: "pokes", label: "Pokes", icon: Bell, count: incomingPokes.length },
    { key: "mylist", label: "My List", icon: UserCheck, count: myList.length },
  ];

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 pb-28 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        {searchOpen && tab === "browse" ? (
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, role, company…"
              className="h-11 w-full rounded-xl border bg-background pl-9 pr-9 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
            />
            <button onClick={closeSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">People</h1>
            <p className="mt-1 text-sm text-muted-foreground">{attendees.length} attending</p>
          </div>
        )}
        {tab === "browse" && !searchOpen && (
          <button
            onClick={() => setSearchOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-background text-muted-foreground transition hover:text-foreground"
            aria-label="Search people"
          >
            <Search className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border bg-muted/40 p-1">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => { setTab(key); if (key !== "browse") closeSearch(); }}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition",
              "min-h-10",
              tab === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {count !== undefined && count > 0 && (
              <span className={cn(
                "inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold",
                key === "pokes" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Browse tab */}
      {tab === "browse" && (
        <>
          <div className="flex flex-wrap gap-2">
            <select className="h-9 rounded-xl border bg-background px-3 text-sm text-muted-foreground" value={goal} onChange={(e) => setGoal(e.target.value)}>
              {goals.map((item) => <option key={item} value={item}>{item === "all" ? "All goals" : item}</option>)}
            </select>
            <select className="h-9 rounded-xl border bg-background px-3 text-sm text-muted-foreground" value={company} onChange={(e) => setCompany(e.target.value)}>
              {companies.map((item) => <option key={item} value={item}>{item === "all" ? "All companies" : item}</option>)}
            </select>
            <select className="h-9 rounded-xl border bg-background px-3 text-sm text-muted-foreground" value={industry} onChange={(e) => setIndustry(e.target.value)}>
              {industries.map((item) => <option key={item} value={item}>{item === "all" ? "All industries" : item}</option>)}
            </select>
            {(query || goal !== "all" || company !== "all" || industry !== "all") && (
              <span className="flex h-9 items-center text-xs text-muted-foreground">{filteredAttendees.length} of {attendees.length}</span>
            )}
          </div>
          <div className="grid gap-3">
            {filteredAttendees.map((attendee) => {
              const isConnected = myList.some((r) => r.targetId === attendee.id);
              return (
                <div key={attendee.id} className="flex items-center gap-2">
                  <Link href={`/events/${params.id}/people/${attendee.id}`} className="block min-w-0 flex-1">
                    <Card className="transition-colors hover:border-primary/40 hover:bg-muted/30">
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted font-semibold">
                          {initials(attendee.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold">{attendee.name}</div>
                          <div className="text-sm text-muted-foreground">{attendee.title}, {attendee.company}</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {attendee.industry ? <Badge>{attendee.industry}</Badge> : null}
                            {attendee.goals.map((g) => <Badge key={g}>{g}</Badge>)}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </Link>
                  <button
                    onClick={() => toggleConnect(attendee.id)}
                    title={isConnected ? "Remove from my list" : "I want to meet this person"}
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition",
                      isConnected
                        ? "border-primary/40 bg-primary/5 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary"
                    )}
                  >
                    {isConnected ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Pokes tab */}
      {tab === "pokes" && (
        <div className="space-y-3">
          {incomingPokes.length === 0 ? (
            <div className="rounded-xl border bg-muted/30 py-12 text-center">
              <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-medium">No pokes yet</p>
              <p className="mt-1 text-xs text-muted-foreground">When someone wants to meet you, they&apos;ll show up here.</p>
            </div>
          ) : (
            incomingPokes.map((req) => {
              const sender = attendees.find((a) => a.id === req.requesterId);
              if (!sender) return null;
              const waved = myList.some((r) => r.targetId === req.requesterId);
              return (
                <div key={req.id} className="rounded-xl border bg-background p-4">
                  <div className="flex items-start gap-3">
                    <Link href={`/events/${params.id}/people/${sender.id}`}>
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted font-semibold hover:bg-muted/70 transition">
                        {initials(sender.name)}
                      </div>
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/events/${params.id}/people/${sender.id}`} className="hover:underline">
                        <span className="font-semibold">{sender.name}</span>
                      </Link>
                      <p className="text-sm text-muted-foreground">{sender.title}, {sender.company}</p>
                      {req.note && (
                        <p className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-sm italic text-muted-foreground">
                          &ldquo;{req.note}&rdquo;
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {sender.goals.map((g) => <Badge key={g} className="text-xs">{g}</Badge>)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => waveBack(req.requesterId)}
                      disabled={waved}
                      className={cn(
                        "flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition",
                        waved
                          ? "bg-primary/10 text-primary"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                    >
                      <UserCheck className="h-4 w-4" />
                      {waved ? "Wave sent!" : "Wave back"}
                    </button>
                    <button
                      onClick={() => setDismissedPokes((prev) => new Set([...prev, req.id]))}
                      className="min-h-11 rounded-xl border px-4 py-2 text-sm text-muted-foreground transition hover:bg-muted"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* My list tab */}
      {tab === "mylist" && (
        <div className="space-y-3">
          {myList.length === 0 ? (
            <div className="rounded-xl border bg-muted/30 py-12 text-center">
              <UserPlus className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-medium">Your list is empty</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tap the <UserPlus className="inline h-3.5 w-3.5" /> on any person to add them here.
              </p>
            </div>
          ) : (
            myList.map((req) => {
              const target = attendees.find((a) => a.id === req.targetId);
              if (!target) return null;
              return (
                <div key={req.id} className="flex items-center gap-3 rounded-xl border bg-background p-3">
                  <Link href={`/events/${params.id}/people/${target.id}`} className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-80 transition">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted font-semibold">
                      {initials(target.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold">{target.name}</p>
                      <p className="text-sm text-muted-foreground">{target.title}, {target.company}</p>
                      {req.note && <p className="mt-1 text-xs text-muted-foreground italic">&ldquo;{req.note}&rdquo;</p>}
                    </div>
                  </Link>
                  <button
                    onClick={() => removeMeetingRequest(req.id)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    title="Remove from list"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </main>
  );
}
