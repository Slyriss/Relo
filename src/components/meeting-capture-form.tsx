"use client";

import { useState } from "react";
import { CalendarClock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Attendee, Meeting } from "@/types";

type MeetingDraft = {
  topic: string;
  promisedAction: string;
  owner: "me" | "them" | "both";
  dueDate: string;
  followupChannel: "email" | "linkedin" | "calendar" | "other";
  permissionToContact: boolean;
  note: string;
};

const defaultDraft: MeetingDraft = {
  topic: "",
  promisedAction: "",
  owner: "me",
  dueDate: "",
  followupChannel: "email",
  permissionToContact: true,
  note: "",
};

export function MeetingCaptureForm({
  eventId,
  current,
  target,
  initialNote,
  compact = false,
  onSave,
}: {
  eventId: string;
  current: Attendee;
  target: Attendee;
  initialNote?: string;
  compact?: boolean;
  onSave: (meeting: Meeting) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState<MeetingDraft>({ ...defaultDraft, note: initialNote ?? "" });
  const [saving, setSaving] = useState(false);

  function update<K extends keyof MeetingDraft>(key: K, value: MeetingDraft[K]) {
    setDraft((currentDraft) => ({ ...currentDraft, [key]: value }));
  }

  async function save() {
    if (!draft.topic.trim() && !draft.promisedAction.trim() && !draft.note.trim()) return;
    setSaving(true);
    const meeting: Meeting = {
      id: crypto.randomUUID(),
      eventId,
      attendeeAId: current.id,
      attendeeBId: target.id,
      note: draft.note.trim() || draft.promisedAction.trim() || draft.topic.trim(),
      topic: draft.topic.trim() || undefined,
      promisedAction: draft.promisedAction.trim() || undefined,
      owner: draft.owner,
      dueDate: draft.dueDate || undefined,
      followupChannel: draft.followupChannel,
      permissionToContact: draft.permissionToContact,
      createdAt: new Date().toISOString(),
      synced: typeof navigator === "undefined" ? true : navigator.onLine,
    };

    await onSave(meeting);
    setDraft(defaultDraft);
    setSaving(false);
  }

  return (
    <div className="grid gap-3 rounded-xl border bg-background p-3">
      <div className={compact ? "grid gap-3" : "grid gap-3 sm:grid-cols-2"}>
        <label className="space-y-1.5 text-sm font-medium">
          Topic
          <Input
            value={draft.topic}
            onChange={(event) => update("topic", event.target.value)}
            placeholder="What did you discuss?"
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Promised action
          <Input
            value={draft.promisedAction}
            onChange={(event) => update("promisedAction", event.target.value)}
            placeholder="Intro, deck, pilot, advice, follow-up..."
          />
        </label>
      </div>

      <div className={compact ? "grid gap-3" : "grid gap-3 sm:grid-cols-3"}>
        <label className="space-y-1.5 text-sm font-medium">
          Owner
          <select
            className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
            value={draft.owner}
            onChange={(event) => update("owner", event.target.value as MeetingDraft["owner"])}
          >
            <option value="me">Me</option>
            <option value="them">Them</option>
            <option value="both">Both</option>
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Due date
          <Input type="date" value={draft.dueDate} onChange={(event) => update("dueDate", event.target.value)} />
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Channel
          <select
            className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
            value={draft.followupChannel}
            onChange={(event) => update("followupChannel", event.target.value as MeetingDraft["followupChannel"])}
          >
            <option value="email">Email</option>
            <option value="linkedin">LinkedIn</option>
            <option value="calendar">Calendar</option>
            <option value="other">Other</option>
          </select>
        </label>
      </div>

      <label className="space-y-1.5 text-sm font-medium">
        Notes
        <Textarea
          value={draft.note}
          onChange={(event) => update("note", event.target.value)}
          placeholder={`What should you remember about ${target.name}?`}
          rows={compact ? 2 : 3}
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={draft.permissionToContact}
          onChange={(event) => update("permissionToContact", event.target.checked)}
          className="h-4 w-4 rounded border"
        />
        Permission to follow up
      </label>

      <Button onClick={save} disabled={saving || (!draft.topic && !draft.promisedAction && !draft.note)}>
        {draft.dueDate ? <CalendarClock className="h-4 w-4" /> : <Check className="h-4 w-4" />}
        Save meeting and follow-up
      </Button>
    </div>
  );
}
