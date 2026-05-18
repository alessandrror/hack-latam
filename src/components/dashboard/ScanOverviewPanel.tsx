import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { riskFindings } from "@/lib/dashboard/findings";
import type { AiInsightsResponseBody } from "@/types/ai-insights";
import type {
  EmailDomainSummary,
  ScanFinding,
  ScanModuleResult,
  Severity,
} from "@/types/scan";

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
      return "bg-sky-950/60 text-sky-100 ring-1 ring-sky-400/35";
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
  emailDomainSummary?: EmailDomainSummary;
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
  emailDomainSummary,
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
    <div className="space-y-8 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="rounded-2xl border border-border bg-card/60 px-5 py-4 shadow-sm backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Objetivo escaneado
        </p>
        <p className="mt-1 font-mono text-sm font-medium text-foreground break-all">
          {normalizedTarget || "—"}
        </p>
      </div>

      {emailDomainSummary ? (
        <div className="rounded-2xl border border-border bg-muted/35 px-5 py-4 shadow-sm backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            OSINT por dominios de correo (mismo apex)
          </p>
          <dl className="mt-3 space-y-2 text-sm text-muted-foreground">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <dt className="font-medium text-foreground">Apex</dt>
              <dd className="font-mono text-foreground">
                {emailDomainSummary.primaryApex ?? "—"}
              </dd>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <dt className="font-medium text-foreground">Líneas analizadas</dt>
              <dd>{emailDomainSummary.parsedEmailLineCount}</dd>
            </div>
            {emailDomainSummary.eligibleEmailDomains.length > 0 ? (
              <div>
                <dt className="font-medium text-foreground">
                  Dominios incluidos
                </dt>
                <dd className="mt-1 font-mono text-xs text-foreground break-all">
                  {emailDomainSummary.eligibleEmailDomains.join(", ")}
                </dd>
              </div>
            ) : (
              <p className="text-xs">
                No quedaron dominios del mismo apex para OSINT desde la lista pegada (o todos
                quedaron fuera del apex del objetivo).
              </p>
            )}
            {emailDomainSummary.skippedExternalDomains.length > 0 ? (
              <div>
                <dt className="font-medium text-amber-800 dark:text-amber-500/95">
                  Omitidos (apex distinto)
                </dt>
                <dd className="mt-1 font-mono text-xs text-foreground break-all opacity-90">
                  {emailDomainSummary.skippedExternalDomains.join(", ")}
                </dd>
              </div>
            ) : null}
            {emailDomainSummary.truncatedEmailList ||
            emailDomainSummary.truncatedUniqueDomainList ? (
              <p className="text-xs text-amber-900/90 dark:text-amber-500/90">
                Entrada truncada por límites de tamaño — revisa el panel de hallazgos
                correspondiente.
              </p>
            ) : null}
          </dl>
        </div>
      ) : null}

      <ul
        className="grid gap-4 auto-rows-fr items-stretch sm:grid-cols-2 lg:grid-cols-4"
        role="list"
      >
        <li className="h-full">
          <Card className="h-full border-border bg-card shadow-sm">
            <CardContent className="flex h-full flex-col gap-1 p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Hostnames (huella observable)
              </span>
              <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">
                {totalHostnames}
              </span>
              <span className="text-xs text-muted-foreground">
                Indicador orientativo tras CT/agregaciones; no garantiza inventario completo.
              </span>
            </CardContent>
          </Card>
        </li>
        <li className="h-full">
          <Card className="h-full border-border bg-card shadow-sm">
            <CardContent className="flex h-full flex-col gap-1 p-4">
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
        <li className="h-full">
          <Card className="h-full border-border bg-card shadow-sm">
            <CardContent className="flex h-full flex-col gap-1 p-4">
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
        <li className="h-full">
          <Card className="h-full border-border bg-card shadow-sm">
            <CardContent className="flex h-full flex-col gap-1 p-4">
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
          Hallazgos de severidad «baja» en esta ejecución:{" "}
          <span className="font-mono font-medium text-foreground">{low}</span>
          {" "}
          (en modo rápido algunos pueden no llegar en la respuesta.)
        </p>
      ) : null}

      <Card className="border-border shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Lo que típicamente atenderías primero
              </h2>
              <p className="mt-1 max-w-prose text-sm text-muted-foreground">
                Extracción instantánea de hallazgos críticos y medios. La pestaña
                «Hallazgos» muestra texto completo, metadatos y contexto técnico.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 min-w-[44px] shrink-0"
              onClick={onGoToFindingsTab}
            >
              Ver detalle completo de hallazgos
            </Button>
          </div>

          {topRisks.length === 0 ? (
            <p className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              Sin hallazgos críticos ni medios en esta ejecución del instantáneo.
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
                IA opcional sobre tus hallazgos
              </h2>
              <p className="mt-1 max-w-prose text-sm text-muted-foreground">
                Genera texto bajo demanda para ordenar siguiente pasos y recordar límites
                — no automatiza remediation ni decide por ti ni sustituye auditoría técnica.
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
                ? "Generando texto…"
                : aiResult
                  ? "Volver a generar orientación IA"
                  : "Generar orientación IA desde hallazgos"}
            </Button>
          </div>

          {aiResult && !aiLoading ? (
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Lectura ejecutiva (IA)
              </h3>
              <p className="mt-2 line-clamp-6 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {aiResult.executiveSummary}
              </p>
              {aiResult.topActions.length > 0 ? (
                <p className="mt-4 text-xs text-muted-foreground">
                  {aiResult.topActions.length} acción(es) priorizadas por el modelo —
                  ves el detalle, descargos y límites en la pestaña «IA».
                </p>
              ) : null}
            </div>
          ) : null}

          {!aiResult && !aiLoading ? (
            <p className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
              Aún no generaste texto IA. Una vez lanzado, te ayuda a ordenar verificación —
              partiendo siempre de los hallazgos estructurados y siendo explícitos sobre límites.
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
