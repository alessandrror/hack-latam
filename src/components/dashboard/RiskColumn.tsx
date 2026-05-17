import { riskFindings } from "@/lib/dashboard/findings";
import type { AiPerFindingInsight } from "@/types/ai-insights";
import type { ScanFinding, Severity } from "@/types/scan";
import { Card, CardContent } from "@/components/ui/card";
import { FindingAiInsightSnippet } from "./FindingAiInsightSnippet";
import { FindingDetailBlocks } from "./FindingDetailBlocks";

function severityBadgeClasses(severity: Severity): string {
  switch (severity) {
    case "critical":
      return "bg-red-100 text-red-800 ring-1 ring-red-200";
    case "medium":
      return "bg-amber-100 text-amber-900 ring-1 ring-amber-200";
    case "low":
      return "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200";
    default: {
      const _e: never = severity;
      return _e;
    }
  }
}

function severityLabelEs(severity: Severity): string {
  switch (severity) {
    case "critical":
      return "crítico";
    case "medium":
      return "medio";
    case "low":
      return "bajo";
    default: {
      const _e: never = severity;
      return _e;
    }
  }
}

type RiskColumnProps = {
  findings: ScanFinding[];
  perFindingInsightsById?: Record<string, AiPerFindingInsight> | null;
};

export function RiskColumn({
  findings,
  perFindingInsightsById,
}: RiskColumnProps) {
  const risks = riskFindings(findings);

  return (
    <Card className="gap-0 border border-border py-0 shadow-sm">
      <CardContent className="flex flex-col gap-4 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Riesgos prioritarios
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Hallazgos críticos y medios que suelen atenderse primero.
      </p>

      {risks.length === 0 ? (
        <p className="mt-4 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Sin hallazgos críticos ni medios en esta pasada. Revisa checklist y lista
          de hostnames públicos como contexto.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {risks.map((finding) => (
            <li
              key={finding.id}
              className="rounded-xl border border-border bg-muted/30 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${severityBadgeClasses(
                    finding.severity,
                  )}`}
                >
                  {severityLabelEs(finding.severity)}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {finding.module}
                </span>
              </div>
              <h3 className="mt-2 text-base font-semibold text-foreground">
                {finding.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {finding.explanation}
              </p>
              <FindingDetailBlocks finding={finding} />
              <FindingAiInsightSnippet
                insight={perFindingInsightsById?.[finding.id] ?? null}
              />
            </li>
          ))}
        </ul>
      )}
      </CardContent>
    </Card>
  );
}
