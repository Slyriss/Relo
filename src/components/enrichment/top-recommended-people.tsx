import { ArrowUpRight, Sparkles, UserRoundCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileAvatar } from "@/components/profile-avatar";
import type { EnrichedRecommendation } from "@/lib/enrichment";
import { SourceConfidenceMeter } from "./source-confidence-meter";

export function TopRecommendedPeople({
  recommendations,
  title = "Top recommended people",
  description = "Ranked by match quality and public enrichment strength.",
  getHref,
  onSelect,
  emptyMessage = "No enriched recommendations available yet.",
  className,
}: {
  recommendations: EnrichedRecommendation[];
  title?: string;
  description?: string;
  getHref?: (recommendation: EnrichedRecommendation) => string | undefined;
  onSelect?: (recommendation: EnrichedRecommendation) => void;
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
        {recommendations.length ? (
          <ol className="space-y-3">
            {recommendations.map((recommendation, index) => {
              const href = getHref?.(recommendation);
              const actionLabel = `Open ${recommendation.attendee.name}`;

              return (
                <li key={recommendation.attendee.id} className="rounded-lg border bg-background p-3 sm:p-4">
                  <div className="flex gap-3">
                    <ProfileAvatar
                      name={recommendation.attendee.name}
                      photoUrl={recommendation.attendee.photoUrl}
                      className="h-10 w-10 rounded-lg bg-primary/10 text-sm text-primary"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="min-w-0 break-words font-semibold">{recommendation.attendee.name}</h4>
                            <Badge className="shrink-0 border-primary/30 text-primary">#{index + 1}</Badge>
                          </div>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {recommendation.attendee.title}, {recommendation.attendee.company}
                          </p>
                        </div>
                        {href ? (
                          <Button asChild variant="ghost" size="icon" title={actionLabel} className="h-10 w-10 shrink-0 rounded-lg">
                            <a href={href}>
                              <ArrowUpRight className="h-4 w-4" />
                            </a>
                          </Button>
                        ) : onSelect ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            title={actionLabel}
                            className="h-10 w-10 shrink-0 rounded-lg"
                            onClick={() => onSelect(recommendation)}
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
                        <div className="flex flex-wrap gap-2">
                          {recommendation.match.why.slice(0, 3).map((reason) => (
                            <Badge key={reason} className="max-w-full whitespace-normal text-left leading-snug">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground sm:justify-end">
                          <Sparkles className="h-4 w-4 text-primary" />
                          {recommendation.priorityScore} priority
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <SourceConfidenceMeter value={recommendation.enrichment.confidence} label="Enrichment confidence" size="sm" />
                        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                          <UserRoundCheck className="h-4 w-4 shrink-0" />
                          <span className="min-w-0 break-words">{recommendation.enrichment.likelyFocus}</span>
                        </div>
                      </div>
                      <div className="mt-3 rounded-lg border bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                        <span className="font-medium text-foreground">Use this angle:</span>{" "}
                        {recommendation.enrichment.strategy[1] ?? recommendation.enrichment.strategy[0]}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">{emptyMessage}</div>
        )}
      </CardContent>
    </Card>
  );
}
