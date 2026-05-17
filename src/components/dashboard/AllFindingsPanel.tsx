import type { AiPerFindingInsight } from "@/types/ai-insights";
import type { ScanFinding, Severity } from "@/types/scan";
import { FindingAiInsightSnippet } from "./FindingAiInsightSnippet";
import { FindingDetailBlocks } from "./FindingDetailBlocks";

function severityBadge(severity: Severity): string {
  switch (severity) {
    case "critical":
      return "bg-red-500/15 text-red-300 ring-1 ring-red-500/35";
    case "medium":
      return "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/30";
    case "low":
      return "bg-cyan-500/10 text-cyan-200 ring-1 ring-cyan-500/25";
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
      <p className="neon-panel p-6 text-sm text-slate-500">
        Sin hallazgos en este escaneo. Revisa activos y checklist.
      </p>
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
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {group.severity}
          </h3>
          <ul className="mt-3 space-y-3">
            {group.items.map((finding) => (
              <li
                key={finding.id}
                className="neon-panel p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${severityBadge(
                      finding.severity,
                    )}`}
                  >
                    {finding.severity}
                  </span>
                  <span className="font-mono text-xs text-slate-500">
                    {finding.module}
                  </span>
                </div>
                <h4 className="mt-2 font-semibold text-white">
                  {finding.title}
                </h4>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">
                  {finding.explanation}
                </p>
                <FindingDetailBlocks finding={finding} />
                <FindingAiInsightSnippet
                  insight={perFindingInsightsById?.[finding.id] ?? null}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
