import { riskFindings } from "@/lib/dashboard/findings";
import type { AiPerFindingInsight } from "@/types/ai-insights";
import type { ScanFinding, Severity } from "@/types/scan";
import { FindingAiInsightSnippet } from "./FindingAiInsightSnippet";
import { FindingDetailBlocks } from "./FindingDetailBlocks";

function severityBadgeClasses(severity: Severity): string {
  switch (severity) {
    case "critical":
      return "bg-red-500/15 text-red-300 ring-1 ring-red-500/30";
    case "medium":
      return "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/25";
    case "low":
      return "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/25";
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
    <section className="neon-panel flex flex-col p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-400/80">
        Riesgos prioritarios
      </h2>
      <p className="mt-1 text-sm text-slate-400">
        Hallazgos críticos y medios que suelen atenderse primero.
      </p>

      {risks.length === 0 ? (
        <p className="mt-4 rounded-lg border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-500">
          No critical or medium findings for this scan. Review the checklist and
          hostnames for context.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {risks.map((finding) => (
            <li
              key={finding.id}
              className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${severityBadgeClasses(
                    finding.severity,
                  )}`}
                >
                  {finding.severity}
                </span>
                <span className="font-mono text-xs text-slate-500">
                  {finding.module}
                </span>
              </div>
              <h3 className="mt-2 text-base font-semibold text-slate-50">
                {finding.title}
              </h3>
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
      )}
    </section>
  );
}
