"use client";

import type {
  AiInsightsRequestBody,
  AiInsightsResponseBody,
} from "@/types/ai-insights";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLeftColumnHeight } from "@/hooks/useLeftColumnHeight";
import { cn } from "@/lib/utils";
import { useRef } from "react";

import { AiChatPanel } from "./AiChatPanel";
import { AiInsightsSkeleton } from "./AiInsightsSkeleton";
import { AiInsightsStructuredReport } from "./AiInsightsStructuredReport";

const DEFAULT_PANEL_DISCLAIMER =
  "La IA ofrece texto de apoyo a partir de hallazgos ya medidos aquí: no ejecuta cambios ni garantiza seguridad futura ni sustituye una revisión técnica completa.";

export type AiInsightsColumnProps = {
  loading: boolean;
  error: string | null;
  result: AiInsightsResponseBody | null;
  disabled?: boolean;
  servedFromCache?: boolean;
  onGenerate: (opts?: { forceRefresh?: boolean }) => void | Promise<void>;
  scanSnapshot?: AiInsightsRequestBody | null;
  isSignedIn?: boolean;
  authLoaded?: boolean;
  onFindingCitationClick?: (findingId: string) => void;
};

export function AiInsightsColumn({
  loading,
  error,
  result,
  disabled,
  servedFromCache,
  onGenerate,
  scanSnapshot,
  isSignedIn = false,
  authLoaded = true,
  onFindingCitationClick,
}: AiInsightsColumnProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const chatHeightPx = useLeftColumnHeight(
    reportRef,
    Boolean(result && !loading),
  );

  return (
    <Card
      className="gap-0 border border-border py-4 shadow-sm"
      aria-label="Orientación con IA desde hallazgos"
    >
      <CardContent className="flex flex-col gap-4 p-4 px-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Orientación IA (persona siempre primero)
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              La IA solo reorganiza tus hallazgos en pasos verificables; tú
              ejecutas cambios después de revisar política técnica.
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
              {loading
                ? "Generando…"
                : result
                  ? "Regenerar orientación IA"
                  : "Generar orientación desde hallazgos"}
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
                className="min-h-11 rounded-lg border-sky-500/50 bg-sky-950/50 px-4 py-2 text-sky-100 hover:bg-sky-900/55 disabled:opacity-45"
              >
                Nueva generación (coste modelo)
              </Button>
            ) : null}
          </div>
        </div>

        {servedFromCache && result && !loading ? (
          <p className="rounded-lg border border-accent/25 bg-accent/5 p-3 text-xs leading-relaxed text-foreground">
            Resultado desde caché temporal (menos de 24h). Usa{" "}
            <strong className="text-sky-200">nueva generación (coste modelo)</strong>
            {" "}
            si quieres recomputar aunque coincida la clave.
          </p>
        ) : null}

        <p className="rounded-lg border border-border bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
          {DEFAULT_PANEL_DISCLAIMER}
        </p>

        {loading ? (
          <div className="mt-2">
            <AiInsightsSkeleton />
          </div>
        ) : null}

        {error && !loading ? (
          <p
            className="rounded-lg border border-red-500/40 bg-red-950/45 p-3 text-sm text-red-100"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {result && !loading ? (
          <div className="mt-2 flex flex-col gap-6 lg:flex-row lg:items-start">
            <div ref={reportRef} className="min-w-0 flex-1">
              <AiInsightsStructuredReport result={result} />
            </div>

            {scanSnapshot ? (
              <div
                className={cn(
                  "flex min-w-0 flex-1 flex-col overflow-hidden",
                  chatHeightPx == null &&
                    "h-[min(28rem,55vh)] max-h-[min(28rem,55vh)]",
                )}
                style={
                  chatHeightPx != null
                    ? {
                        height: chatHeightPx,
                        maxHeight: chatHeightPx,
                        minHeight: chatHeightPx,
                      }
                    : undefined
                }
              >
                <AiChatPanel
                  scanSnapshot={scanSnapshot}
                  priorInsights={result}
                  isSignedIn={isSignedIn}
                  authLoaded={authLoaded}
                  onCitationClick={onFindingCitationClick}
                  className="h-full max-h-full min-h-0"
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
