import { Building2, CalendarCheck, ExternalLink, Github, Globe2, Linkedin, Mail, Newspaper, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PublicSignal } from "@/lib/enrichment";
import { SourceConfidenceMeter } from "./source-confidence-meter";

const sourceIcon = {
  linkedin: Linkedin,
  company: Building2,
  news: Newspaper,
  github: Github,
  website: Globe2,
  username: Search,
  email: Mail,
  event: CalendarCheck,
} satisfies Record<PublicSignal["source"], React.ComponentType<{ className?: string }>>;

const sourceLabel: Record<PublicSignal["source"], string> = {
  linkedin: "LinkedIn",
  company: "Company",
  news: "News",
  github: "GitHub",
  website: "Website",
  username: "Username",
  email: "Email",
  event: "Event",
};

export function PublicSignalsPanel({
  signals,
  title = "Public signals",
  description = "Publicly visible context that can support outreach.",
  emptyMessage = "No public signals found yet.",
  className,
}: {
  signals: PublicSignal[];
  title?: string;
  description?: string;
  emptyMessage?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {signals.length ? (
          <ul className="space-y-3">
            {signals.map((signal) => {
              const Icon = sourceIcon[signal.source];

              return (
                <li key={`${signal.source}-${signal.label}-${signal.value}`} className="rounded-lg border bg-background p-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold">{signal.label}</h4>
                        <Badge className="px-2 py-0.5">{sourceLabel[signal.source]}</Badge>
                      </div>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground">{signal.value}</p>
                      <div className="mt-3">
                        <SourceConfidenceMeter value={signal.confidence} size="sm" label={`${signal.label} confidence`} />
                      </div>
                    </div>
                    {signal.url ? (
                      <a
                        href={signal.url}
                        target="_blank"
                        rel="noreferrer"
                        title={`Open ${signal.label}`}
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition",
                          "hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        )}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">{emptyMessage}</div>
        )}
      </CardContent>
    </Card>
  );
}

