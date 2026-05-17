"use client";

import { cn } from "@/lib/utils";

export type ScanTabId =
  | "overview"
  | "assets"
  | "findings"
  | "checklist"
  | "ai";

const RESULT_TABS: { id: ScanTabId; label: string }[] = [
  { id: "overview", label: "Resumen" },
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
  /** When false, hides the Checklist tab (e.g. quick scan). */
  showChecklistTab?: boolean;
};

export function ScanTabs({
  active,
  onChange,
  disabled,
  hasResults,
  showChecklistTab = true,
}: ScanTabsProps) {
  const tabs = showChecklistTab
    ? RESULT_TABS
    : RESULT_TABS.filter((t) => t.id !== "checklist");

  return (
    <nav aria-label="Secciones de resultados" className="w-full">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:mb-2.5">
        Resultados
      </p>
      <div
        role="tablist"
        aria-label="Navegar entre resumen, activos y hallazgos"
        className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1"
      >
        {tabs.map((tab) => {
          const tabDisabled = Boolean(disabled) || !hasResults;
          const isActive = active === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={tabDisabled}
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative shrink-0 cursor-pointer rounded-full px-3.5 py-2 text-sm font-medium outline-none transition-[background-color,color,box-shadow] duration-150",
                "focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-muted/50 disabled:hover:text-muted-foreground motion-reduce:transition-none",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
