"use client";

import { anyApi } from "convex/server";
import { useQuery } from "convex/react";
import type { GenericId } from "convex/values";
import type { AiInsightsResponseBody } from "@/types/ai-insights";
import type { ScanFinding, ScanResponseBody } from "@/types/scan";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import { X } from "lucide-react";
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
        className={`fixed inset-y-0 right-0 z-[50] w-[min(20rem,calc(100vw-3rem))] border-l border-cyan-500/20 bg-[#030308]/95 shadow-[-12px_0_40px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-transform duration-200 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-cyan-500/15 px-4 py-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400/85">
                Historial de escaneos
              </p>
              <p className="text-xs text-slate-500">
                Cloud en vivo vía Convex
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5 border-cyan-500/35 bg-[#071018]/90 px-3 py-2 text-xs font-medium text-cyan-100 hover:border-cyan-400/55 hover:bg-cyan-500/10 hover:text-cyan-50 dark:bg-[#071018]/90"
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
                              scanMode: row.scanMode,
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
                        className="h-auto min-h-0 w-full flex-col items-start gap-2 rounded-xl border-slate-800/70 bg-slate-950/40 px-3 py-3 text-left hover:border-cyan-400/35 hover:bg-cyan-500/5 dark:border-slate-800/70 dark:bg-slate-950/40 dark:hover:bg-cyan-500/5"
                      >
                        <div className="flex w-full items-start justify-between gap-2">
                          <span className="min-w-0 font-mono text-xs font-medium text-cyan-200 break-all">
                            {row.normalizedTarget || row.target}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              row.scanMode === "deep"
                                ? "border-purple-400/35 bg-purple-500/15 text-[10px] font-bold text-purple-100 hover:bg-purple-500/15 dark:border-purple-400/35"
                                : "border-cyan-400/35 bg-cyan-500/10 text-[10px] font-bold text-cyan-50 hover:bg-cyan-500/10 dark:border-cyan-400/35"
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
        className="fixed bottom-6 right-4 z-[55] gap-2 rounded-xl border-cyan-500/35 bg-[#071018]/95 px-4 py-2.5 font-semibold text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.15)] backdrop-blur-md hover:border-cyan-400/50 hover:bg-cyan-500/10 sm:right-8 dark:bg-[#071018]/95 dark:hover:bg-cyan-500/10"
      >
        <span className="tabular-nums" aria-hidden>
          ◈
        </span>
        {open ? "Ocultar" : "Historial"}
      </Button>
    </>
  );
}
