"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, PenLine } from "lucide-react";
import { ScanPanel } from "@/components/scan-panel";
import { useAppStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";

export default function ScanPage({ params }: { params: { id: string } }) {
  const [tab, setTab] = useState<"badge" | "log">("badge");
  const [badgeUrl, setBadgeUrl] = useState("");
  const attendees = useAppStore(useShallow((s) => s.attendees.filter((a) => a.eventId === params.id)));
  const me = attendees[0];

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    if (me) setBadgeUrl(`${baseUrl}/meet/${params.id}/${me.id}`);
  }, [me, params.id]);

  const tabs = [
    { id: "badge" as const, label: "My Badge",    icon: QrCode  },
    { id: "log"   as const, label: "Log Meeting", icon: PenLine },
  ];

  return (
    <main className="mx-auto max-w-xl space-y-5 px-4 py-6 pb-28 sm:px-6">

      {/* Tab switcher */}
      <div className="grid grid-cols-2 gap-2 rounded-xl border bg-muted/40 p-1">
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
      {tab === "badge" && me && (
        <div className="flex flex-col items-center gap-6 py-4">
          <p className="text-sm text-muted-foreground">
            Show this to someone you just met so they can log your meeting.
          </p>

          <div className="flex flex-col items-center gap-4 rounded-2xl border bg-background px-8 py-8 shadow-sm">
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

          <button
            onClick={() => setTab("log")}
            className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm text-primary hover:underline"
          >
            Want to log a meeting instead? →
          </button>
        </div>
      )}

      {/* Log Meeting */}
      {tab === "log" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Log a meeting</h2>
            <p className="text-sm text-muted-foreground">
              Confirm who you met and add a note — saved offline if needed.
            </p>
          </div>
          <ScanPanel eventId={params.id} />
        </div>
      )}
    </main>
  );
}
