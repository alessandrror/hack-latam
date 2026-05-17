import type { AiPerFindingInsight } from "@/types/ai-insights";
import type { ScanFinding, Severity } from "@/types/scan";
import { Card, CardContent } from "@/components/ui/card";
import { FindingAiInsightSnippet } from "./FindingAiInsightSnippet";
import { FindingDetailBlocks } from "./FindingDetailBlocks";

function severityBadge(severity: Severity): string {
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

function severityHeadingEs(severity: Severity): string {
  switch (severity) {
    case "critical":
      return "Severidad: crítica";
    case "medium":
      return "Severidad: media";
    case "low":
      return "Prioridad informativa (baja)";
    default: {
      const _e: never = severity;
      return _e;
    }
  }
}

function severityBadgeLabelEs(severity: Severity): string {
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

const ORDER: Severity[] = ["critical", "medium", "low"];

type AllFindingsPanelProps = {
  findings: ScanFinding[];
  perFindingInsightsById?: Record<string, AiPerFindingInsight> | null;
};

export function AllFindingsPanel({
  findings,
  perFindingInsightsById,
}: AllFindingsPanelProps) {
  if (findings.length === 0) {
    return (
      <Card className="border border-border shadow-sm">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Sin hallazgos en esta pasada. Revisa activos y checklist.
          </p>
        </CardContent>
      </Card>
    );
  }

  const grouped = ORDER.map((sev) => ({
    severity: sev,
    items: findings.filter((f) => f.severity === sev),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-8">
      {grouped.map((group) => (
        <section key={group.severity}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {severityHeadingEs(group.severity)}
          </h3>
          <ul className="mt-3 space-y-3">
            {group.items.map((finding) => (
              <li key={finding.id}>
                <Card className="gap-0 border border-border py-0 shadow-sm">
                  <CardContent className="space-y-0 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${severityBadge(
                      finding.severity,
                    )}`}
                  >
                    {severityBadgeLabelEs(finding.severity)}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {finding.module}
                  </span>
                </div>
                <h4 className="mt-2 font-semibold text-foreground">
                  {finding.title}
                </h4>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {finding.explanation}
                </p>
                <FindingDetailBlocks finding={finding} />
                <FindingAiInsightSnippet
                  insight={perFindingInsightsById?.[finding.id] ?? null}
                />
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
