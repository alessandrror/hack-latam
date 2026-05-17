import type {
  AiInsightsConfidence,
  AiInsightsResponseBody,
  AiInsightsTopAction,
} from "@/types/ai-insights";

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
      return "border-sky-500/35 bg-sky-950/40 text-sky-50";
    case "low":
      return "border-emerald-500/35 bg-emerald-950/35 text-emerald-50";
    default: {
      const _n: never = p;
      return _n;
    }
  }
}

export function AiInsightsStructuredReport({
  result,
}: {
  result: AiInsightsResponseBody;
}) {
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-border bg-muted/20 p-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Resumen ejecutivo
        </h3>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {result.executiveSummary}
        </p>
      </section>

      <section>
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
                className={`rounded-lg border p-3 ${priorityTone(action.priority)}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold capitalize tracking-wide text-muted-foreground">
                    {priorityLabelEs(action.priority)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    · {confidenceLabelEs(action.confidence)}
                  </span>
                </div>
                <p className="mt-2 font-semibold text-foreground">{action.title}</p>
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
      </section>

      <section>
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Límites y advertencias
        </h3>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">
          {result.disclaimers.map((line, idx) => (
            <li key={`${line.slice(0, 48)}-${idx}`}>{line}</li>
          ))}
        </ul>
      </section>

      {result.modelUsed ? (
        <p className="font-mono text-[10px] uppercase text-muted-foreground">
          Modelo: {result.modelUsed}
        </p>
      ) : null}
    </div>
  );
}
