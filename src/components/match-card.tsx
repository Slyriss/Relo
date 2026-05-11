import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { initials } from "@/lib/utils";
import type { Attendee, MatchRecommendation } from "@/types";

export function MatchCard({ attendee, match }: { attendee: Attendee; match: MatchRecommendation }) {
  return (
    <Card>
      <CardContent className="flex gap-4 pt-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted font-semibold">
          {initials(attendee.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">{attendee.name}</h3>
              <p className="text-sm text-muted-foreground">
                {attendee.title}, {attendee.company}
              </p>
            </div>
            <Badge className="border-primary/30 text-primary">
              <Sparkles className="mr-1 h-3 w-3" />
              {match.score}
            </Badge>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {match.why.map((why) => (
              <Badge key={why}>{why}</Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
