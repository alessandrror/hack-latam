"use client";

import { History, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatHistoryRelativeEs,
  type ScanSessionHistoryEntry,
} from "@/lib/scan/scanSessionHistory";

type ScanHistorySidebarProps = {
  entries: ScanSessionHistoryEntry[];
  selectedId: string | null;
  onSelect: (entry: ScanSessionHistoryEntry) => void;
  onNewScan: () => void;
  newScanDisabled: boolean;
};

export function ScanHistorySidebar({
  entries,
  selectedId,
  onSelect,
  onNewScan,
  newScanDisabled,
}: ScanHistorySidebarProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Acciones
        </p>
        <Button
          type="button"
          variant="default"
          size="default"
          className="w-full gap-2 rounded-md shadow-none"
          disabled={newScanDisabled}
          onClick={onNewScan}
        >
          <Plus className="size-4 shrink-0" aria-hidden />
          Nuevo escaneo
        </Button>
        {newScanDisabled ? (
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Define objetivo y modo en el panel principal para lanzar un escaneo.
          </p>
        ) : null}
      </div>

      <div className="space-y-3 border-t border-border/40 pt-5">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <History className="size-3.5" aria-hidden />
          Historial (esta sesión)
        </p>
        {entries.length === 0 ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Aún no hay escaneos en esta sesión. Los completados aparecerán aquí para
            volver a ellos al instante.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5" role="list">
            {entries.map((entry) => {
              const label =
                entry.result.normalizedTarget?.trim() ||
                entry.inputTarget.trim() ||
                "—";
              const isActive = selectedId === entry.id;
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(entry)}
                    className={cn(
                      "flex w-full flex-col gap-0.5 rounded-md border px-3 py-2.5 text-left text-sm transition-colors duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                      isActive
                        ? "border-primary/35 bg-primary/10 text-foreground"
                        : "border-border/50 bg-muted/20 text-foreground hover:bg-muted/40",
                    )}
                  >
                    <span className="truncate font-mono text-xs font-medium">
                      {label}
                    </span>
                    <span className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="rounded border border-border/60 bg-background/60 px-1.5 py-px font-medium uppercase tracking-wide">
                        {entry.mode === "deep" ? "Profundo" : "Rápido"}
                      </span>
                      <span className="tabular-nums">
                        {formatHistoryRelativeEs(entry.savedAt)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
