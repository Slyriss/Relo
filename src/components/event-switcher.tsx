"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronRight, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";
import type { Event } from "@/types";

type SortKey = "date" | "name";
type StatusFilter = "upcoming" | "past";

function fmt(date: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleDateString("en-US", opts);
}

export function EventSwitcher({ currentEventId }: { currentEventId: string }) {
  const router   = useRouter();
  const events   = useAppStore(useShallow((s) => s.events));

  const [query,         setQuery]         = useState("");
  const [filterOpen,    setFilterOpen]    = useState(false);
  const [filterYear,    setFilterYear]    = useState<string | null>(null);
  const [filterMonth,   setFilterMonth]   = useState<number | null>(null);
  const [filterStatus,  setFilterStatus]  = useState<StatusFilter | null>(null);
  const [sortBy,        setSortBy]        = useState<SortKey>("date");

  const panelRef = useRef<HTMLDivElement>(null);

  // Close filter panel on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Unique years from all events
  const years = useMemo(
    () => [...new Set(events.map((e) => new Date(e.startsAt).getFullYear().toString()))].sort().reverse(),
    [events]
  );

  // Months that have at least one event (for the selected year, or all if no year selected)
  const activeMonths = useMemo(() => {
    const pool = filterYear ? events.filter((e) => new Date(e.startsAt).getFullYear().toString() === filterYear) : events;
    return [...new Set(pool.map((e) => new Date(e.startsAt).getMonth()))].sort((a, b) => a - b);
  }, [events, filterYear]);

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const filtered = useMemo(() => {
    const nowTime = Date.now();
    let list: Event[] = [...events];

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q));
    }
    if (filterYear) {
      list = list.filter((e) => new Date(e.startsAt).getFullYear().toString() === filterYear);
    }
    if (filterMonth !== null) {
      list = list.filter((e) => new Date(e.startsAt).getMonth() === filterMonth);
    }
    if (filterStatus === "upcoming") list = list.filter((e) => new Date(e.endsAt).getTime() >= nowTime);
    if (filterStatus === "past")     list = list.filter((e) => new Date(e.endsAt).getTime() <  nowTime);

    list.sort((a, b) =>
      sortBy === "name"
        ? a.title.localeCompare(b.title)
        : new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
    );

    return list;
  }, [events, query, filterYear, filterMonth, filterStatus, sortBy]);

  const activeFilterCount = [filterYear, filterMonth !== null ? "m" : null, filterStatus].filter(Boolean).length;
  const currentTime = Date.now();

  function clearFilters() {
    setFilterYear(null);
    setFilterMonth(null);
    setFilterStatus(null);
    setSortBy("date");
  }

  return (
    <div ref={panelRef} className="space-y-2">
      {/* Search + filter row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events…"
            className="h-10 w-full rounded-xl border bg-background pl-9 pr-9 text-sm outline-none ring-0 transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={() => setFilterOpen((v) => !v)}
          className={cn(
            "flex h-10 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition",
            filterOpen || activeFilterCount > 0
              ? "border-primary bg-primary/5 text-primary"
              : "bg-background text-muted-foreground hover:text-foreground"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {filterOpen && (
        <div className="rounded-xl border bg-background p-4 shadow-lg space-y-4">
          {/* Year */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Year</p>
            <div className="flex flex-wrap gap-1.5">
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => { setFilterYear(filterYear === y ? null : y); setFilterMonth(null); }}
                  className={cn(
                    "rounded-lg border px-3 py-1 text-sm font-medium transition",
                    filterYear === y
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-muted/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* Month */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Month</p>
            <div className="flex flex-wrap gap-1.5">
              {activeMonths.map((m) => (
                <button
                  key={m}
                  onClick={() => setFilterMonth(filterMonth === m ? null : m)}
                  className={cn(
                    "rounded-lg border px-3 py-1 text-sm font-medium transition",
                    filterMonth === m
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-muted/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {MONTHS[m]}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
            <div className="flex gap-1.5">
              {(["upcoming", "past"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(filterStatus === s ? null : s)}
                  className={cn(
                    "rounded-lg border px-3 py-1 text-sm font-medium capitalize transition",
                    filterStatus === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-muted/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Sort by</p>
            <div className="flex gap-1.5">
              {(["date", "name"] as SortKey[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={cn(
                    "rounded-lg border px-3 py-1 text-sm font-medium capitalize transition",
                    sortBy === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-muted/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Event results */}
      {(query || activeFilterCount > 0 || filterOpen) && (
        <div className="space-y-1.5">
          {filtered.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No events match your search.</p>
          ) : (
            filtered.map((e) => {
              const active = e.id === currentEventId || e.slug === currentEventId;
              const isPast = new Date(e.endsAt).getTime() < currentTime;
              return (
                <button
                  key={e.id}
                  onClick={() => { router.push(`/events/${e.id}`); setQuery(""); setFilterOpen(false); }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition",
                    active
                      ? "border-primary bg-primary/5"
                      : "bg-background hover:bg-muted/40"
                  )}
                >
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm font-semibold", active && "text-primary")}>
                      {e.title}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {fmt(e.startsAt, { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {e.venue}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {isPast && (
                      <span className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">
                        Past
                      </span>
                    )}
                    {active ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        Current
                      </span>
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
