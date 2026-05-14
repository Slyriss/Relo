import type { PersonEnrichment } from "@/lib/enrichment";
import { CompanyNewsPanel } from "./company-news-panel";
import { OpenerStrategyPanel } from "./opener-strategy-panel";
import { PublicSignalsPanel } from "./public-signals-panel";
import { SourceConfidenceMeter } from "./source-confidence-meter";

export function EnrichmentBrief({
  enrichment,
  company,
  className,
}: {
  enrichment: PersonEnrichment;
  company?: string;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="mb-4 rounded-lg border bg-background p-4">
        <SourceConfidenceMeter value={enrichment.confidence} label="Overall enrichment confidence" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <PublicSignalsPanel signals={enrichment.signals} />
        <CompanyNewsPanel company={company} items={enrichment.companyNews} />
        <OpenerStrategyPanel strategies={enrichment.strategy} likelyFocus={enrichment.likelyFocus} className="lg:col-span-2" />
      </div>
    </section>
  );
}

