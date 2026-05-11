"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import type { Event } from "@/types";

export function EventForm() {
  const router = useRouter();
  const organization = useAppStore((state) => state.organization);
  const createEvent = useAppStore((state) => state.createEvent);
  const [form, setForm] = useState({
    title: "",
    description: "",
    venue: "",
    startsAt: "",
    endsAt: "",
    status: "draft"
  });

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const id = slugify(form.title || crypto.randomUUID());
    const nextEvent: Event = {
      id,
      slug: id,
      organizationId: organization.id,
      title: form.title,
      description: form.description,
      venue: form.venue,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
      status: form.status as Event["status"]
    };
    createEvent(nextEvent);
    router.push(`/dashboard/events/${id}`);
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <form className="grid gap-4" onSubmit={submit}>
          <Input placeholder="Event title" value={form.title} onChange={(event) => update("title", event.target.value)} required />
          <Textarea
            placeholder="What makes this event valuable?"
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            required
          />
          <Input placeholder="Venue" value={form.venue} onChange={(event) => update("venue", event.target.value)} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input type="datetime-local" value={form.startsAt} onChange={(event) => update("startsAt", event.target.value)} required />
            <Input type="datetime-local" value={form.endsAt} onChange={(event) => update("endsAt", event.target.value)} required />
          </div>
          <select
            className="h-11 rounded-xl border bg-background px-3 text-sm"
            value={form.status}
            onChange={(event) => update("status", event.target.value)}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <Button type="submit">Create event</Button>
        </form>
      </CardContent>
    </Card>
  );
}
