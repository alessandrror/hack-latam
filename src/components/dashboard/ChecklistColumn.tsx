import {
  buildChecklistRows,
  informationalFindings,
  type ChecklistStatus,
} from "@/lib/dashboard/findings";
import type { AiPerFindingInsight } from "@/types/ai-insights";
import type { ScanFinding } from "@/types/scan";
import { Card, CardContent } from "@/components/ui/card";
import { FindingAiInsightSnippet } from "./FindingAiInsightSnippet";
import { FindingDetailBlocks } from "./FindingDetailBlocks";

function statusStyles(status: ChecklistStatus): string {
  switch (status) {
    case "pass":
      return "border-emerald-500/25 bg-emerald-500/5 text-emerald-200";
    case "warn":
      return "border-amber-500/25 bg-amber-500/5 text-amber-100";
    case "fail":
      return "border-red-500/25 bg-red-500/5 text-red-200";
    default: {
      const _e: never = status;
      return _e;
    }
  }
}

function statusLabel(status: ChecklistStatus): string {
  switch (status) {
    case "pass":
      return "OK";
    case "warn":
      return "Review";
    case "fail":
      return "Issue";
    default: {
      const _e: never = status;
      return _e;
    }
  }
}

function badgeClasses(status: ChecklistStatus): string {
  switch (status) {
    case "pass":
      return "bg-emerald-400 text-slate-950";
    case "warn":
      return "bg-amber-400 text-slate-950";
    case "fail":
      return "bg-red-400 text-slate-950";
    default: {
      const _e: never = status;
      return _e;
    }
  }
}

type ChecklistColumnProps = {
  findings: ScanFinding[];
  checklistRowInsightsById?: Record<string, AiPerFindingInsight> | null;
  perFindingInsightsById?: Record<string, AiPerFindingInsight> | null;
};

export function ChecklistColumn({
  findings,
  checklistRowInsightsById,
  perFindingInsightsById,
}: ChecklistColumnProps) {
  const rows = buildChecklistRows(findings);
  const info = informationalFindings(findings, { excludeModuleChecks: true });

  return (
    <Card className="neon-panel gap-0 py-0 shadow-none ring-0">
      <CardContent className="flex flex-col gap-4 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-400/80">
        Checklist técnico
      </h2>
      <p className="mt-1 text-sm text-slate-400">
        Autenticación de correo y snapshot HTTPS según este escaneo.
      </p>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          No checklist rows yet (modules may have been skipped for this input).
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 ${statusStyles(row.status)}`}
            >
              <span
                className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badgeClasses(row.status)}`}
              >
                {statusLabel(row.status)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-50">{row.label}</p>
                {row.detail ? (
                  <p className="mt-0.5 text-xs text-slate-400">{row.detail}</p>
                ) : null}
                <FindingAiInsightSnippet
                  insight={checklistRowInsightsById?.[row.id] ?? null}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Otras señales
      </h3>
      {info.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">
          No additional low-severity notes beyond the checklist.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {info.map((finding) => (
            <li
              key={finding.id}
              className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"
            >
              <p className="font-mono text-[10px] uppercase text-slate-500">
                {finding.module}
              </p>
              <p className="text-sm font-medium text-slate-200">
                {finding.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
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
