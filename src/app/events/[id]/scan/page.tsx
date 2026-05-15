"use client";

import { use, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, PenLine, ScanLine } from "lucide-react";
import { ScanPanel } from "@/components/scan-panel";
import { useCurrentEventAttendee, useEvent } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function ScanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const event = useEvent(id);
  const eventId = event?.id ?? id;
  const [tab, setTab] = useState<"badge" | "log">("badge");
  const [badgeUrl, setBadgeUrl] = useState("");
  const me = useCurrentEventAttendee(eventId);

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    if (me) setBadgeUrl(`${baseUrl}/meet/${eventId}/${me.id}`);
  }, [me, eventId]);

  const tabs = [
    { id: "badge" as const, label: "My Badge",    icon: QrCode  },
    { id: "log"   as const, label: "Log Meeting", icon: PenLine },
  ];

  const badgePanel = me ? (
    <div className="flex flex-col items-center gap-6 py-4">
      <p className="text-sm text-muted-foreground">
        Show this to someone you just met so they can log your meeting.
      </p>

      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border bg-background px-8 py-8 shadow-sm">
        <div className="rounded-xl border bg-white p-4">
          {badgeUrl ? (
            <QRCodeSVG value={badgeUrl} size={200} />
          ) : (
            <div className="h-[200px] w-[200px] animate-pulse rounded bg-muted" />
          )}
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold">{me.name}</p>
          <p className="text-sm text-muted-foreground">{me.title}{me.company ? ` · ${me.company}` : ""}</p>
        </div>
      </div>
    </div>
  ) : null;

  const logPanel = (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Log a meeting</h2>
        <p className="text-sm text-muted-foreground">
          Confirm who you met and add a note. This is the only place for meeting capture.
        </p>
      </div>
      <ScanPanel eventId={eventId} />
    </div>
  );

  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 pb-28 sm:px-6">
      <div>
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
          <ScanLine className="h-4 w-4" />
          Scan workspace
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">Badge and meeting capture</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Scan is intentionally separate from discovery: use it when a real-world conversation has happened.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="grid grid-cols-2 gap-2 rounded-xl border bg-muted/40 p-1 lg:hidden">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition",
              tab === id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* My Badge */}
      <div className="lg:hidden">
        {tab === "badge" && badgePanel}
        {tab === "badge" && me ? (
          <button
            onClick={() => setTab("log")}
            className="mx-auto inline-flex min-h-10 items-center rounded-lg px-3 text-sm text-primary hover:underline"
          >
            Want to log a meeting instead? →
          </button>
        ) : null}
        {tab === "log" ? logPanel : null}
      </div>

      <div className="hidden gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="rounded-2xl border bg-muted/20 p-5">
          {logPanel}
        </section>
        <aside className="sticky top-24 rounded-2xl border bg-background p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <QrCode className="h-4 w-4 text-primary" />
            My QR badge
          </div>
          {badgePanel}
        </aside>
      </div>
    </main>
  );
}
