"use client";

export type ScanTabId =
  | "overview"
  | "scan"
  | "assets"
  | "findings"
  | "checklist"
  | "ai";

const ALL_TABS: { id: ScanTabId; label: string }[] = [
  { id: "overview", label: "Resumen" },
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
    ? ALL_TABS
    : ALL_TABS.filter((t) => t.id !== "checklist");

  return (
    <div
      role="tablist"
      aria-label="Secciones del escáner"
      className="flex flex-wrap gap-2 border-b border-border pb-4"
    >
      {tabs.map((tab) => {
        const isScanTab = tab.id === "scan";
        const tabDisabled =
          Boolean(disabled) || (!isScanTab && !hasResults);
        const isActive = active === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={tabDisabled}
            onClick={() => onChange(tab.id)}
            className={`min-h-11 min-w-[44px] cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
              isActive
                ? "border-primary bg-primary/10 text-primary shadow-sm"
                : "border-border bg-muted/50 text-muted-foreground hover:border-input hover:bg-muted hover:text-foreground"
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
