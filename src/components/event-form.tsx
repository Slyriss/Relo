"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import type { Event } from "@/types";

const TITLE_LIMIT = 120;
const VENUE_LIMIT = 160;
const DESCRIPTION_LIMIT = 1200;
const UNSUPPORTED_TEXT = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/;

function localDateTimeValue(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export function EventForm() {
  const router = useRouter();
  const organization = useAppStore((state) => state.organization);
  const createEvent = useAppStore((state) => state.createEvent);
  const nowMin = useMemo(() => localDateTimeValue(new Date()), []);
  const maxDate = useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 5);
    return localDateTimeValue(date);
  }, []);
  const [form, setForm] = useState({
    title: "",
    description: "",
    venue: "",
    startsAt: "",
    endsAt: "",
    status: "draft"
  });
  const [error, setError] = useState("");

  function update(field: keyof typeof form, value: string) {
    setError("");
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const title = form.title.trim();
    const description = form.description.trim();
    const venue = form.venue.trim();
    const startsAt = new Date(form.startsAt);
    const endsAt = new Date(form.endsAt);

    if (!title || !description || !venue) {
      setError("Add a title, venue, and short event description.");
      return;
    }
    if (title.length > TITLE_LIMIT || venue.length > VENUE_LIMIT || description.length > DESCRIPTION_LIMIT) {
      setError("Shorten the event details before creating the event.");
      return;
    }
    if ([title, description, venue].some((value) => UNSUPPORTED_TEXT.test(value))) {
      setError("Remove unsupported control characters before creating the event.");
      return;
    }
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      setError("Choose a valid start and end date.");
      return;
    }
    if (startsAt < new Date(nowMin) || localDateTimeValue(startsAt) > maxDate) {
      setError("Choose a start date within the next five years.");
      return;
    }
    if (endsAt <= startsAt) {
      setError("The event end time must be after the start time.");
      return;
    }

    const id = slugify(title) || `event-${crypto.randomUUID()}`;
    const nextEvent: Event = {
      id,
      slug: id,
      organizationId: organization?.id ?? "pending",
      title,
      description,
      venue,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      status: form.status as Event["status"]
    };
    const saved = await createEvent(nextEvent);
    if (!saved) {
      setError("Could not create this event. Check your permissions and try again.");
      return;
    }
    router.push(`/dashboard/events/${saved?.id ?? id}`);
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <form className="grid gap-4" onSubmit={submit}>
          <label className="space-y-1.5 text-sm font-medium">
            Event title
            <Input
              placeholder="AI Founder Dinner"
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              maxLength={TITLE_LIMIT}
              required
            />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Description
            <Textarea
              placeholder="What makes this event valuable?"
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              maxLength={DESCRIPTION_LIMIT}
              required
            />
            <span className="block text-xs text-muted-foreground">{form.description.length}/{DESCRIPTION_LIMIT}</span>
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Venue
            <Input
              placeholder="The Foundry, Singapore"
              value={form.venue}
              onChange={(event) => update("venue", event.target.value)}
              maxLength={VENUE_LIMIT}
              required
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium">
              Starts
              <Input
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) => update("startsAt", event.target.value)}
                min={nowMin}
                max={maxDate}
                required
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              Ends
              <Input
                type="datetime-local"
                value={form.endsAt}
                onChange={(event) => update("endsAt", event.target.value)}
                min={form.startsAt || nowMin}
                max={maxDate}
                required
              />
            </label>
          </div>
          <select
            className="h-11 rounded-xl border bg-background px-3 text-sm"
            value={form.status}
            onChange={(event) => update("status", event.target.value)}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          {error ? <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
          <Button type="submit">Create event</Button>
        </form>
      </CardContent>
    </Card>
  );
}
