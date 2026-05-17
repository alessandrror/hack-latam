"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ScanTabId =
  | "scan"
  | "assets"
  | "findings"
  | "checklist"
  | "ai";

const TABS: { id: ScanTabId; label: string }[] = [
  { id: "scan", label: "Escaneo" },
  { id: "assets", label: "Activos" },
  { id: "findings", label: "Hallazgos" },
  { id: "checklist", label: "Checklist" },
  { id: "ai", label: "IA" },
];

type ScanTabsProps = {
  active: ScanTabId;
  onChange: (id: ScanTabId) => void;
  disabled?: boolean;
  hasResults?: boolean;
};

export function ScanTabs({
  active,
  onChange,
  disabled,
  hasResults,
}: ScanTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Secciones del escáner"
      className="flex flex-wrap gap-2 border-b border-cyan-500/15 pb-4"
    >
      {TABS.map((tab) => {
        const isScanTab = tab.id === "scan";
        const tabDisabled =
          disabled || (!isScanTab && !hasResults);
        const isActive = active === tab.id;

        return (
          <Button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={tabDisabled}
            onClick={() => onChange(tab.id)}
            variant="outline"
            size="lg"
            className={cn(
              "h-auto shrink-0 rounded-xl border px-4 py-2.5 shadow-none hover:bg-transparent",
              isActive
                ? "tab-active-glow"
                : "border-slate-700/80 bg-slate-900/40 text-slate-400 hover:border-cyan-500/25 hover:text-slate-200 dark:border-slate-700/80 dark:bg-slate-900/40 dark:hover:bg-slate-900/60",
              tabDisabled ? "opacity-40" : null,
            )}
          >
            {tab.label}
          </Button>
        );
      })}
    </div>
  );
}
