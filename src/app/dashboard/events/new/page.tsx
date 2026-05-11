import { EventForm } from "@/components/event-form";

export default function NewEventPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Create event</h1>
        <p className="mt-1 text-muted-foreground">Set the core details and publish when your attendee list is ready.</p>
      </div>
      <EventForm />
    </div>
  );
}
