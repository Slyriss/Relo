"use client";

import { use, useMemo, useState } from "react";
import { ArrowRight, GitBranch, Handshake, Network, Users, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMissedConnections, GOAL_COLOR, graphifyEventNetwork } from "@/lib/graph";
import { useShallow } from "zustand/react/shallow";
import { useAppStore, useEvent } from "@/lib/store";

const GOAL_LABEL: Record<string, string> = {
  fundraising: "Raising",
  hiring: "Hiring",
  partnerships: "Partnerships",
  customers: "Customers",
  learning: "Learning",
};

export default function GraphPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const event = useEvent(id);
  const eventId = event?.id ?? id;
  const attendees = useAppStore(useShallow((s) => s.attendees.filter((a) => a.eventId === eventId)));
  const meetings  = useAppStore(useShallow((s) => s.meetings.filter((m)  => m.eventId === eventId)));
  const [showGraph, setShowGraph] = useState(false);
  const [showSuggested, setShowSuggested] = useState(true);

  const graph = useMemo(() => graphifyEventNetwork(attendees, meetings, 320), [attendees, meetings]);
  const { nodes, edges, suggestedEdges, communities, insights, stats } = graph;
  const missed = getMissedConnections(attendees, meetings);

  // Build a map: attendeeId → Set of attendeeIds they've met
  const metWith = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const m of meetings) {
      if (!map.has(m.attendeeAId)) map.set(m.attendeeAId, new Set());
      if (!map.has(m.attendeeBId)) map.set(m.attendeeBId, new Set());
      map.get(m.attendeeAId)!.add(m.attendeeBId);
      map.get(m.attendeeBId)!.add(m.attendeeAId);
    }
    return map;
  }, [meetings]);

  // Connector rows sorted by meeting count desc
  const connectors = useMemo(
    () =>
      [...attendees]
        .map((a) => ({ attendee: a, count: metWith.get(a.id)?.size ?? 0 }))
        .filter((r) => r.count > 0)
        .sort((a, b) => b.count - a.count),
    [attendees, metWith]
  );

  const maxCount = connectors[0]?.count ?? 1;
  const uniqueConnected = new Set(meetings.flatMap((m) => [m.attendeeAId, m.attendeeBId])).size;

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-6 pb-28 sm:px-6">

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-semibold">Connections</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          See who&apos;s networking, who&apos;s not, and who should meet next.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-background px-4 py-3">
          <div className="flex items-center gap-2">
            <Handshake className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Meetings</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{meetings.length}</p>
        </div>
        <div className="rounded-xl border bg-background px-4 py-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Connected</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{uniqueConnected}</p>
        </div>
        <div className="rounded-xl border bg-background px-4 py-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium text-muted-foreground">Intros needed</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{missed.length}</p>
        </div>
        <div className="rounded-xl border bg-background px-4 py-3">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Density</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{Math.round(stats.density * 100)}%</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">

        {/* Left col: connector list + meeting log */}
        <div className="space-y-6">

          {/* Connector leaderboard */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Top connectors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {connectors.length === 0 ? (
                <p className="text-sm text-muted-foreground">No meetings logged yet.</p>
              ) : (
                connectors.map(({ attendee, count }) => {
                  const color = GOAL_COLOR[attendee.goals[0]] ?? "#94a3b8";
                  const metIds = [...(metWith.get(attendee.id) ?? [])];
                  const metPeople = metIds
                    .map((id) => attendees.find((a) => a.id === id))
                    .filter(Boolean) as typeof attendees;

                  return (
                    <div key={attendee.id} className="space-y-2">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                          style={{ background: color }}
                        >
                          {attendee.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>

                        {/* Name + company */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="truncate text-sm font-medium">{attendee.name}</span>
                            <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                              {count} {count === 1 ? "meeting" : "meetings"}
                            </span>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">{attendee.company}</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="ml-11 space-y-1.5">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(count / maxCount) * 100}%`,
                              background: color,
                            }}
                          />
                        </div>

                        {/* Met-with chips */}
                        <div className="flex flex-wrap gap-1">
                          {metPeople.map((p) => (
                            <span
                              key={p.id}
                              className="inline-flex items-center rounded-full border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground"
                            >
                              {p.name.split(" ")[0]}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Meeting log */}
          {meetings.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Meeting log</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {meetings.map((m) => {
                  const a = attendees.find((x) => x.id === m.attendeeAId);
                  const b = attendees.find((x) => x.id === m.attendeeBId);
                  if (!a || !b) return null;
                  const colorA = GOAL_COLOR[a.goals[0]] ?? "#94a3b8";
                  const colorB = GOAL_COLOR[b.goals[0]] ?? "#94a3b8";
                  return (
                    <div key={m.id} className="rounded-xl border bg-background px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{ background: colorA }}
                        >
                          {a.name[0]}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{ background: colorB }}
                        >
                          {b.name[0]}
                        </span>
                        <span className="text-sm font-medium">
                          {a.name.split(" ")[0]} &amp; {b.name.split(" ")[0]}
                        </span>
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                          {a.company.split(" ")[0]} · {b.company.split(" ")[0]}
                        </span>
                      </div>
                      {m.note ? (
                        <p className="mt-2 text-sm text-muted-foreground">{m.note}</p>
                      ) : null}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Graphify insights</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {insights.map((insight) => (
                <div key={insight.id} className="rounded-xl border bg-background px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-muted-foreground">{insight.label}</span>
                    <span className="text-lg font-bold">{insight.value}</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{insight.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right col */}
        <div className="space-y-4">

          {/* Intros to make */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Intros to make</CardTitle>
              <p className="text-xs text-muted-foreground">High-match pairs that haven&apos;t met yet.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {missed.length === 0 ? (
                <p className="text-xs text-muted-foreground">Everyone&apos;s well connected!</p>
              ) : (
                missed.map((mc) => {
                  const colorA = GOAL_COLOR[mc.source.goals[0]] ?? "#94a3b8";
                  const colorB = GOAL_COLOR[mc.target.goals[0]] ?? "#94a3b8";
                  return (
                    <div
                      key={`${mc.source.id}-${mc.target.id}`}
                      className="rounded-xl border bg-background p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                          style={{ background: colorA }}
                        >
                          {mc.source.name[0]}
                        </span>
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                          style={{ background: colorB }}
                        >
                          {mc.target.name[0]}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold">
                            {mc.source.name.split(" ")[0]} &amp; {mc.target.name.split(" ")[0]}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {mc.source.company.split(" ")[0]} · {mc.target.company.split(" ")[0]}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                          {mc.score}
                        </span>
                      </div>

                      {/* Goal badges */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {[...new Set([...mc.source.goals, ...mc.target.goals])].map((g) => (
                          <span
                            key={g}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                            style={{ background: GOAL_COLOR[g] ?? "#94a3b8" }}
                          >
                            {GOAL_LABEL[g] ?? g}
                          </span>
                        ))}
                      </div>

                      {mc.why[0] && (
                        <p className="mt-1.5 text-[11px] text-muted-foreground">{mc.why[0]}</p>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Network graph — collapsible fingerprint */}
          <div>
            <button
              onClick={() => setShowGraph((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl border bg-background px-4 py-3 text-left text-sm font-medium text-muted-foreground transition hover:bg-muted/40"
            >
              Network graph
              <span className="text-xs">{showGraph ? "Hide" : "Show"}</span>
            </button>

            {showGraph && (
              <div className="mt-2 overflow-hidden rounded-xl border bg-background">
                <div className="flex items-center justify-between gap-3 border-b px-3 py-2.5">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <GitBranch className="h-3.5 w-3.5" />
                    {stats.communityCount} clusters
                  </div>
                  <button
                    onClick={() => setShowSuggested((value) => !value)}
                    className="rounded-lg border px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted/40"
                  >
                    {showSuggested ? "Hide suggested" : "Show suggested"}
                  </button>
                </div>
                <svg
                  viewBox="0 0 320 320"
                  className="h-full w-full"
                  aria-label="Attendee relationship network"
                >
                  {showSuggested &&
                    suggestedEdges.map((e) => (
                      <line
                        key={e.id}
                        x1={e.x1} y1={e.y1}
                        x2={e.x2} y2={e.y2}
                        stroke="#f59e0b"
                        strokeDasharray="4 5"
                        strokeOpacity={0.35}
                        strokeWidth={1.2}
                      />
                    ))}
                  {edges.map((e) => (
                    <line
                      key={e.id}
                      x1={e.x1} y1={e.y1}
                      x2={e.x2} y2={e.y2}
                      stroke="currentColor"
                      strokeOpacity={0.12}
                      strokeWidth={1.5}
                    />
                  ))}
                  {nodes.map((node) => (
                    <g key={node.id}>
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={node.r}
                        fill={GOAL_COLOR[node.primaryGoal] ?? "#94a3b8"}
                        fillOpacity={0.75}
                        stroke="white"
                        strokeWidth={node.status === "broker" ? 3 : 1.5}
                      />
                      {node.meetingCount > 0 ? (
                        <text
                          x={node.x}
                          y={node.y + 3}
                          textAnchor="middle"
                          className="fill-white text-[9px] font-bold"
                        >
                          {node.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                        </text>
                      ) : null}
                    </g>
                  ))}
                </svg>
                <div className="flex flex-wrap gap-3 border-t px-3 py-2.5">
                  {communities.slice(0, 5).map((community) => (
                    <span key={community.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: community.color }} />
                      {community.label} · {community.attendeeIds.length}
                    </span>
                  ))}
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="inline-block h-2 w-4 border-t border-dashed border-amber-500" />
                    suggested
                  </span>
                  {Object.entries(GOAL_COLOR).map(([goal, color]) => (
                    <span key={goal} className="hidden items-center gap-1.5 text-xs text-muted-foreground xl:flex">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
                      {goal}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
