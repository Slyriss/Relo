"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { initials } from "@/lib/utils";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@/lib/store";
import type { Goal } from "@/types";

export default function PeoplePage({ params }: { params: { id: string } }) {
  const attendees = useAppStore(useShallow((state) => state.attendees.filter((attendee) => attendee.eventId === params.id)));
  const [query, setQuery] = useState("");
  const [goal, setGoal] = useState("all");
  const [company, setCompany] = useState("all");
  const [industry, setIndustry] = useState("all");
  const goals: Array<Goal | "all"> = ["all", "fundraising", "hiring", "partnerships", "customers", "learning"];
  const companies = useMemo(() => ["all", ...Array.from(new Set(attendees.map((attendee) => attendee.company))).sort()], [attendees]);
  const industries = useMemo(
    () => ["all", ...Array.from(new Set(attendees.map((attendee) => attendee.industry).filter(Boolean))).sort()],
    [attendees]
  );
  const filteredAttendees = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return attendees.filter((attendee) => {
      const matchesQuery =
        !normalizedQuery ||
        [attendee.name, attendee.company, attendee.title, attendee.bio, attendee.industry]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedQuery));
      const matchesGoal = goal === "all" || attendee.goals.includes(goal as Goal);
      const matchesCompany = company === "all" || attendee.company === company;
      const matchesIndustry = industry === "all" || attendee.industry === industry;
      return matchesQuery && matchesGoal && matchesCompany && matchesIndustry;
    });
  }, [attendees, company, goal, industry, query]);

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 pb-28 sm:px-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">People</h1>
        <p className="mt-1 text-muted-foreground">Search the room and open useful context before you meet.</p>
      </div>
      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search name, role, company"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <select className="h-11 rounded-xl border bg-background px-3 text-sm" value={goal} onChange={(event) => setGoal(event.target.value)}>
            {goals.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All goals" : item}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-xl border bg-background px-3 text-sm"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
          >
            {companies.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All companies" : item}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-xl border bg-background px-3 text-sm"
            value={industry}
            onChange={(event) => setIndustry(event.target.value)}
          >
            {industries.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All industries" : item}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>
      <div className="text-sm text-muted-foreground">
        Showing {filteredAttendees.length} of {attendees.length} attendees
      </div>
      <div className="grid gap-3">
        {filteredAttendees.map((attendee) => (
          <Card key={attendee.id}>
            <CardContent className="flex gap-4 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted font-semibold">
                {initials(attendee.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{attendee.name}</div>
                <div className="text-sm text-muted-foreground">
                  {attendee.title}, {attendee.company}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {attendee.industry ? <Badge>{attendee.industry}</Badge> : null}
                  {attendee.goals.map((goal) => (
                    <Badge key={goal}>{goal}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
