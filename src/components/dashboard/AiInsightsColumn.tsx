"use client";

import type {
  AiInsightsResponseBody,
  AiInsightsTopAction,
} from "@/types/ai-insights";

import { AiInsightsSkeleton } from "./AiInsightsSkeleton";

function priorityTone(p: AiInsightsTopAction["priority"]): string {
  switch (p) {
    case "critical":
      return "border-red-500/30 bg-red-500/10 text-red-200";
    case "medium":
      return "border-amber-500/30 bg-amber-500/10 text-amber-100";
    case "low":
      return "border-emerald-500/25 bg-emerald-500/5 text-emerald-200";
    default: {
      const _n: never = p;
      return _n;
    }
  }
}

const DEFAULT_PANEL_DISCLAIMER =
  "El texto de IA es orientativo. Estas comprobaciones son pasivas e incompletas — verifica los hallazgos en tu entorno.";

export type AiInsightsColumnProps = {
  loading: boolean;
  error: string | null;
  result: AiInsightsResponseBody | null;
  disabled?: boolean;
  onGenerate: () => void;
};

export function AiInsightsColumn({
  loading,
  error,
  result,
  disabled,
  onGenerate,
}: AiInsightsColumnProps) {
  return (
    <section
      aria-label="AI insights"
      className="neon-panel flex flex-col p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-400/80">
            Insights con IA
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Resumen de remediación bajo demanda — sin listas de hostnames por
            defecto.
          </p>
        </div>
        <button
          type="button"
          disabled={disabled || loading}
          onClick={onGenerate}
          className="min-h-11 shrink-0 cursor-pointer rounded-lg btn-gradient-neon px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Generando…" : result ? "Regenerar" : "Generar"}
        </button>
      </div>

      <p className="mt-3 rounded-lg border border-slate-800/90 bg-slate-950/50 p-3 text-xs leading-relaxed text-slate-500">
        {DEFAULT_PANEL_DISCLAIMER}
      </p>

      {loading ? (
        <div className="mt-4">
          <AiInsightsSkeleton />
        </div>
      ) : null}

      {error && !loading ? (
        <p
          className="mt-4 rounded-lg border border-red-500/25 bg-red-950/35 p-3 text-sm text-red-300"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {result && !loading ? (
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Summary
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
              {result.executiveSummary}
            </p>
          </div>

          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Prioritized actions
            </h3>
            {result.topActions.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                No actions returned — regenerate or review findings manually.
              </p>
            ) : (
              <ol className="mt-2 list-decimal space-y-3 pl-4 text-sm text-slate-200">
                {result.topActions.map((action) => (
                  <li
                    key={action.id}
                    className={`rounded-lg border p-3 ${priorityTone(
                      action.priority,
                    )}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-300">
                        {action.priority}
                      </span>
                      <span className="text-xs uppercase text-slate-500">
                        confidence: {action.confidence}
                      </span>
                    </div>
                    <p className="mt-2 font-semibold text-slate-50">
                      {action.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-300/95">
                      {action.why}
                    </p>
                    <p className="mt-2 text-xs font-medium text-slate-200">
                      <span className="text-slate-500">Verify: </span>
                      {action.verifyStep}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Limitations &amp; caveats
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-500">
              {result.disclaimers.map((line, idx) => (
                <li key={`${line.slice(0, 48)}-${idx}`}>{line}</li>
              ))}
            </ul>
          </div>

          {result.modelUsed ? (
            <p className="font-mono text-[10px] uppercase text-slate-600">
              Model: {result.modelUsed}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
