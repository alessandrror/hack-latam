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
      return "border-emerald-500/40 bg-emerald-950/35 text-emerald-100";
    case "warn":
      return "border-sky-500/35 bg-sky-950/40 text-sky-100";
    case "fail":
      return "border-red-500/40 bg-red-950/45 text-red-100";
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
      return "Revisar";
    case "fail":
      return "Problema";
    default: {
      const _e: never = status;
      return _e;
    }
  }
}

function badgeClasses(status: ChecklistStatus): string {
  switch (status) {
    case "pass":
      return "bg-emerald-600 text-white";
    case "warn":
      return "bg-sky-600 text-white";
    case "fail":
      return "bg-red-600 text-white";
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
    <Card className="gap-0 border border-border py-0 shadow-sm">
      <CardContent className="flex flex-col gap-4 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Checklist técnico
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Autenticación de correo y snapshot HTTPS según este escaneo.
      </p>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No hay filas de checklist disponibles para esta entrada — quizá algunos módulos
          se omitieron (por ejemplo IP en lugar de dominio o modo rápido).
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
                  className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 ${statusStyles(row.status)}`}
            >
              <span
                className={`mt-0.5 w-20 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-center whitespace-nowrap ${badgeClasses(row.status)}`}
              >
                {statusLabel(row.status)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{row.label}</p>
                {row.detail ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{row.detail}</p>
                ) : null}
                <FindingAiInsightSnippet
                  insight={checklistRowInsightsById?.[row.id] ?? null}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Otras señales
      </h3>
      {info.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Sin notas adicionales de prioridad baja fuera del checklist.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {info.map((finding) => (
            <li
              key={finding.id}
              className="w-full rounded-lg border border-border bg-muted/30 p-3"
            >
              <p className="font-mono text-[10px] uppercase text-muted-foreground">
                {finding.module}
              </p>
              <p className="text-sm font-medium text-foreground">
                {finding.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
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
