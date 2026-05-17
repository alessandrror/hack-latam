import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { riskFindings } from "@/lib/dashboard/findings";
import type { AiInsightsResponseBody } from "@/types/ai-insights";
import type { ScanFinding, ScanModuleResult, Severity } from "@/types/scan";

function severityLabelEs(severity: Severity): string {
  switch (severity) {
    case "critical":
      return "Crítico";
    case "medium":
      return "Medio";
    case "low":
      return "Bajo";
    default: {
      const _e: never = severity;
      return _e;
    }
  }
}

function severityPillClasses(severity: Severity): string {
  switch (severity) {
    case "critical":
      return "bg-red-950/70 text-red-100 ring-1 ring-red-500/40";
    case "medium":
      return "bg-amber-950/60 text-amber-100 ring-1 ring-amber-400/35";
    case "low":
      return "bg-emerald-950/50 text-emerald-100 ring-1 ring-emerald-400/35";
    default: {
      const _e: never = severity;
      return _e;
    }
  }
}

export type ScanOverviewPanelProps = {
  normalizedTarget: string;
  findings: ScanFinding[];
  modules: ScanModuleResult[];
  totalHostnames: number;
  aiResult: AiInsightsResponseBody | null;
  aiLoading: boolean;
  aiDisabled: boolean;
  onGenerateInsights: () => void;
  onGoToFindingsTab: () => void;
  showChecklistDeepDive: boolean;
};

export function ScanOverviewPanel({
  normalizedTarget,
  findings,
  modules,
  totalHostnames,
  aiResult,
  aiLoading,
  aiDisabled,
  onGenerateInsights,
  onGoToFindingsTab,
  showChecklistDeepDive,
}: ScanOverviewPanelProps) {
  const critical = findings.filter((f) => f.severity === "critical").length;
  const medium = findings.filter((f) => f.severity === "medium").length;
  const low = findings.filter((f) => f.severity === "low").length;
  const modulesOk = modules.filter((m) => m.status === "ok").length;
  const topRisks = riskFindings(findings).slice(0, 4);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border bg-card/60 px-5 py-4 shadow-sm backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Objetivo analizado
        </p>
        <p className="mt-1 font-mono text-sm font-medium text-foreground break-all">
          {normalizedTarget || "—"}
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="list">
        <li>
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Hostnames públicos (CT / agregado)
              </span>
              <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">
                {totalHostnames}
              </span>
              <span className="text-xs text-muted-foreground">
                Volumen orientativo de huella observable
              </span>
            </CardContent>
          </Card>
        </li>
        <li>
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Hallazgos críticos
              </span>
              <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">
                {critical}
              </span>
              <span className="text-xs text-muted-foreground">
                Prioridad inmediata
              </span>
            </CardContent>
          </Card>
        </li>
        <li>
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Hallazgos medios
              </span>
              <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">
                {medium}
              </span>
              <span className="text-xs text-muted-foreground">
                Revisar en planificación
              </span>
            </CardContent>
          </Card>
        </li>
        <li>
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Módulos OK
              </span>
              <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">
                {modulesOk}/{modules.length}
              </span>
              <span className="text-xs text-muted-foreground">
                Ejecución del pipeline pasivo
              </span>
            </CardContent>
          </Card>
        </li>
      </ul>

      {low > 0 ? (
        <p className="text-xs text-muted-foreground">
          Hallazgos de nivel bajo en esta pasada:{" "}
          <span className="font-mono font-medium text-foreground">{low}</span>
          {" "}
          (en modo rápido puede no mostrarse la lista completa).
        </p>
      ) : null}

      <Card className="border-border shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Prioridades inmediatas
              </h2>
              <p className="mt-1 max-w-prose text-sm text-muted-foreground">
                Extracto de hallazgos críticos y medios. Usa «Hallazgos» para el
                detalle completo.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 min-w-[44px] shrink-0"
              onClick={onGoToFindingsTab}
            >
              Ver todos los hallazgos
            </Button>
          </div>

          {topRisks.length === 0 ? (
            <p className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              Sin hallazgos críticos ni medios en esta pasada.
            </p>
          ) : (
            <ul className="space-y-3" role="list">
              {topRisks.map((f) => (
                <li
                  key={f.id}
                  className="rounded-xl border border-border bg-muted/20 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${severityPillClasses(
                        f.severity,
                      )}`}
                    >
                      {severityLabelEs(f.severity)}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {f.module}
                    </span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-foreground">
                    {f.title}
                  </h3>
                  <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {f.explanation}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                IA — resumen ejecutivo
              </h2>
              <p className="mt-1 max-w-prose text-sm text-muted-foreground">
                Generación bajo demanda para priorizar verificación y remediación. No
                reemplaza auditoría técnica.
              </p>
            </div>
            <Button
              type="button"
              size="lg"
              className="min-h-11 min-w-[44px]"
              disabled={aiDisabled || aiLoading}
              onClick={() => onGenerateInsights()}
            >
              {aiLoading
                ? "Generando…"
                : aiResult
                  ? "Actualizar IA"
                  : "Generar resumen IA"}
            </Button>
          </div>

          {aiResult && !aiLoading ? (
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Resumen
              </h3>
              <p className="mt-2 line-clamp-6 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {aiResult.executiveSummary}
              </p>
              {aiResult.topActions.length > 0 ? (
                <p className="mt-4 text-xs text-muted-foreground">
                  {aiResult.topActions.length}{" "}
                  acción(es) sugerida(s). Abre la pestaña «IA» para pasos completos y
                  descargos.
                </p>
              ) : null}
            </div>
          ) : null}

          {!aiResult && !aiLoading ? (
            <p className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
              Aún no hay resumen IA. Genera uno para obtener prioridades verificables
              alineadas a tus hallazgos.
            </p>
          ) : null}

          {showChecklistDeepDive ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Para checklist técnica detallada, abre{" "}
              <span className="font-semibold text-foreground">«Checklist»</span>.
            </p>
          ) : null}
        </CardContent>
      </Card>

    </div>
  );
}
