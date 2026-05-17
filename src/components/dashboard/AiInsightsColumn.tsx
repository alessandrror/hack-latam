"use client";

import type {
  AiInsightsConfidence,
  AiInsightsResponseBody,
  AiInsightsTopAction,
} from "@/types/ai-insights";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { AiInsightsSkeleton } from "./AiInsightsSkeleton";

function priorityLabelEs(p: AiInsightsTopAction["priority"]): string {
  switch (p) {
    case "critical":
      return "prioridad alta";
    case "medium":
      return "prioridad media";
    case "low":
      return "prioridad baja";
    default: {
      const _n: never = p;
      return _n;
    }
  }
}

function confidenceLabelEs(c: AiInsightsConfidence): string {
  switch (c) {
    case "high":
      return "Confianza: alta";
    case "medium":
      return "Confianza: media";
    case "low":
      return "Confianza: baja";
    default: {
      const _n: never = c;
      return _n;
    }
  }
}

function priorityTone(p: AiInsightsTopAction["priority"]): string {
  switch (p) {
    case "critical":
      return "border-red-500/40 bg-red-950/45 text-red-50";
    case "medium":
      return "border-amber-500/35 bg-amber-950/40 text-amber-50";
    case "low":
      return "border-emerald-500/35 bg-emerald-950/35 text-emerald-50";
    default: {
      const _n: never = p;
      return _n;
    }
  }
}

const DEFAULT_PANEL_DISCLAIMER =
  "La IA ofrece texto de apoyo a partir de hallazgos ya medidos aquí: no ejecuta cambios ni garantiza seguridad futura ni sustituye una revisión técnica completa.";

export type AiInsightsColumnProps = {
  loading: boolean;
  error: string | null;
  result: AiInsightsResponseBody | null;
  disabled?: boolean;
  servedFromCache?: boolean;
  onGenerate: (opts?: { forceRefresh?: boolean }) => void | Promise<void>;
};

export function AiInsightsColumn({
  loading,
  error,
  result,
  disabled,
  servedFromCache,
  onGenerate,
}: AiInsightsColumnProps) {
  return (
    <Card className="gap-0 border border-border py-4 shadow-sm" aria-label="Orientación con IA desde hallazgos">
      <CardContent className="flex flex-col gap-4 p-4 px-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Orientación IA (persona siempre primero)
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            La IA solo reorganiza tus hallazgos en pasos verificables; tú ejecutas cambios después de revisar política técnica.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-start">
          <Button
            type="button"
            disabled={disabled || loading}
            onClick={() => {
              void onGenerate({ forceRefresh: false });
            }}
            size="lg"
            className="min-h-11 cursor-pointer rounded-lg px-4 py-2 text-sm"
          >
            {loading ? "Generando…" : result ? "Regenerar orientación IA" : "Generar orientación desde hallazgos"}
          </Button>
          {result ? (
            <Button
              type="button"
              variant="outline"
              disabled={disabled || loading}
              onClick={() => {
                void onGenerate({ forceRefresh: true });
              }}
              title="Fuerza una nueva llamada al modelo ignorando la caché temporal (consumo/coste de tokens)."
              size="lg"
              className="min-h-11 rounded-lg border-amber-500/50 bg-amber-950/50 px-4 py-2 text-amber-100 hover:bg-amber-900/50 disabled:opacity-45"
            >
              Nueva generación (coste modelo)
            </Button>
          ) : null}
        </div>
      </div>

      {servedFromCache && result && !loading ? (
        <p className="mt-3 rounded-lg border border-accent/25 bg-accent/5 p-3 text-xs leading-relaxed text-foreground">
          Resultado desde caché temporal (menos de 24h). Usa{" "}
          <strong className="text-amber-200">
            nueva generación (coste modelo)
          </strong>
          {" "}
          si quieres recomputar aunque coincida la clave.
        </p>
      ) : null}

      <p className="mt-3 rounded-lg border border-border bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
        {DEFAULT_PANEL_DISCLAIMER}
      </p>

      {loading ? (
        <div className="mt-4">
          <AiInsightsSkeleton />
        </div>
      ) : null}

      {error && !loading ? (
        <p
          className="mt-4 rounded-lg border border-red-500/40 bg-red-950/45 p-3 text-sm text-red-100"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {result && !loading ? (
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Resumen ejecutivo
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {result.executiveSummary}
            </p>
          </div>

          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Acciones sugeridas
            </h3>
            {result.topActions.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                El modelo no devolvió acciones — regenera la IA o revisa los
                hallazgos manualmente.
              </p>
            ) : (
              <ol className="mt-2 list-decimal space-y-3 pl-4 text-sm text-foreground">
                {result.topActions.map((action) => (
                  <li
                    key={action.id}
                    className={`rounded-lg border p-3 ${priorityTone(
                      action.priority,
                    )}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold capitalize tracking-wide text-muted-foreground">
                        {priorityLabelEs(action.priority)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        · {confidenceLabelEs(action.confidence)}
                      </span>
                    </div>
                    <p className="mt-2 font-semibold text-foreground">
                      {action.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {action.why}
                    </p>
                    <p className="mt-2 text-xs font-medium text-foreground">
                      <span className="font-normal text-muted-foreground">
                        Verificar:{" "}
                      </span>
                      {action.verifyStep}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Límites y advertencias
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">
              {result.disclaimers.map((line, idx) => (
                <li key={`${line.slice(0, 48)}-${idx}`}>{line}</li>
              ))}
            </ul>
          </div>

          {result.modelUsed ? (
            <p className="font-mono text-[10px] uppercase text-muted-foreground">
              Modelo: {result.modelUsed}
            </p>
          ) : null}
        </div>
      ) : null}
      </CardContent>
    </Card>
  );
}
