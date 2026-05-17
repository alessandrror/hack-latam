"use client";

import { anyApi } from "convex/server";
import { useQuery } from "convex/react";
import type { GenericId } from "convex/values";
import type { AiInsightsResponseBody } from "@/types/ai-insights";
import type { ScanFinding, ScanResponseBody } from "@/types/scan";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import { X, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type ScanHistoryDoc = {
  _id: GenericId<"scans">;
  _creationTime: number;
  target: string;
  normalizedTarget: string;
  inputKind: ScanResponseBody["inputKind"];
  scanMode: "quick" | "deep";
  findings: ScanFinding[];
  modules: ScanResponseBody["modules"];
  aiInsights?: AiInsightsResponseBody | null;
  createdAt: number;
};

type ScanHistorySidebarProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  onRestoreScan: (
    payload: ScanResponseBody,
    options: {
      convexScanId: GenericId<"scans">;
      aiInsights: AiInsightsResponseBody | null;
    },
  ) => void;
};

function formatAgeEs(createdAt: number): string {
  const delta = Math.max(0, Date.now() - createdAt);
  const mins = Math.floor(delta / 60_000);
  if (mins < 1) return "justo ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days} d`;
}

export function ScanHistorySidebar({
  open,
  setOpen,
  onRestoreScan,
}: ScanHistorySidebarProps) {
  const scans = useQuery(anyApi.scans.getUserScans, {});

  useEffect(() => {
    if (!open) return;
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [open, setOpen]);

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Cerrar panel de historial"
          className="fixed inset-0 z-[48] cursor-pointer bg-black/55 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        id="scan-history-panel"
        aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-[50] w-[min(20rem,calc(100vw-3rem))] border-l border-border bg-card shadow-lg transition-transform duration-200 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Historial de escaneos
              </p>
              <p className="text-xs text-muted-foreground">
                Convex en servidor; el guardado tras cada consulta debe enlazarse
                desde la app para ver filas nuevas aquí.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5 px-3 py-2 text-xs font-medium"
              onClick={() => setOpen(false)}
              aria-label="Cerrar historial"
            >
              <X className="size-3.5 shrink-0 opacity-90" aria-hidden />
              Cerrar
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            {!scans ? (
              <p className="px-2 py-4 text-xs text-slate-500">Cargando…</p>
            ) : scans.length === 0 ? (
              <p className="px-2 py-4 text-xs text-slate-500">
                Tus escaneos aparecerán aquí cuando ejecutes uno con la sesión
                iniciada.
              </p>
            ) : (
              <ul className="flex flex-col gap-2 pb-24">
                {scans.map((row: ScanHistoryDoc) => {
                  const nf =
                    Array.isArray(row.findings) && row.findings.length > 0
                      ? row.findings.length
                      : 0;
                  return (
                    <li key={String(row._id)}>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          onRestoreScan(
                            {
                              target: row.target,
                              normalizedTarget: row.normalizedTarget,
                              inputKind: row.inputKind,
                              findings:
                                (row.findings as ScanFinding[]) ?? [],
                              modules: row.modules ?? [],
                              mode: row.scanMode,
                            },
                            {
                              convexScanId: row._id,
                              aiInsights:
                                row.aiInsights && typeof row.aiInsights === "object"
                                  ? (row.aiInsights as AiInsightsResponseBody)
                                  : null,
                            },
                          )
                        }
                        className="h-auto min-h-0 w-full flex-col items-start gap-2 rounded-xl border-border bg-muted/30 px-3 py-3 text-left hover:bg-muted"
                      >
                        <div className="flex w-full items-start justify-between gap-2">
                          <span className="min-w-0 font-mono text-xs font-medium text-foreground break-all">
                            {row.normalizedTarget || row.target}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              row.scanMode === "deep"
                                ? "border-primary/25 bg-primary/5 text-[10px] font-bold text-primary"
                                : "border-accent/25 bg-accent/10 text-[10px] font-bold text-accent"
                            }
                          >
                            {row.scanMode === "deep" ? "Profundo" : "Rápido"}
                          </Badge>
                        </div>
                        <p className="mt-2 flex w-full items-center justify-between text-[11px] text-slate-500">
                          <span>{nf} hallazgos</span>
                          <span>{formatAgeEs(row.createdAt)}</span>
                        </p>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </aside>

      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="scan-history-panel"
        className="fixed bottom-6 right-4 z-[55] gap-2 rounded-xl border-border bg-card px-4 py-2.5 font-semibold text-foreground shadow-md hover:bg-muted sm:right-8"
      >
        <History className="size-4 shrink-0 opacity-80" aria-hidden />
        {open ? "Ocultar" : "Historial"}
      </Button>
    </>
  );
}
