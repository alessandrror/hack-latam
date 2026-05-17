"use client";

import { useAuth } from "@clerk/nextjs";
import { AiInsightsColumn } from "@/components/dashboard/AiInsightsColumn";
import { AllFindingsPanel } from "@/components/dashboard/AllFindingsPanel";
import { AssetsColumn } from "@/components/dashboard/AssetsColumn";
import { ChecklistColumn } from "@/components/dashboard/ChecklistColumn";
import { RiskColumn } from "@/components/dashboard/RiskColumn";
import { ScanOverviewPanel } from "@/components/dashboard/ScanOverviewPanel";
import { SkeletonGrid } from "@/components/dashboard/SkeletonGrid";
import {
  aggregateHostnamesFromFindings,
  buildChecklistRows,
} from "@/lib/dashboard/findings";
import { cn } from "@/lib/utils";
import type { AiInsightsResponseBody } from "@/types/ai-insights";
import type { ScanResponseBody } from "@/types/scan";
import { useCallback, useMemo, useState, type FormEvent } from "react";

import { ScanFormPanel, type ScanMode } from "./ScanFormPanel";
import { ScanTabs, type ScanTabId } from "./ScanTabs";

function isAiInsightsResponseBody(x: unknown): x is AiInsightsResponseBody {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.executiveSummary === "string" &&
    Array.isArray(o.topActions) &&
    Array.isArray(o.disclaimers) &&
    typeof o.perFindingInsightsById === "object" &&
    o.perFindingInsightsById !== null
  );
}

type ScanWorkspaceProps = {
  initialTarget?: string;
};

export function ScanWorkspace({ initialTarget = "" }: ScanWorkspaceProps) {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const [target, setTarget] = useState(initialTarget);
  const [scanMode, setScanMode] = useState<ScanMode>("deep");
  const [activeTab, setActiveTab] = useState<ScanTabId>("scan");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResponseBody | null>(null);
  const [hasScanned, setHasScanned] = useState(false);
  const [aiResult, setAiResult] = useState<AiInsightsResponseBody | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const findingsForGrid = useMemo(
    () => result?.findings ?? [],
    [result?.findings],
  );
  const hostAggregate = useMemo(
    () => aggregateHostnamesFromFindings(findingsForGrid),
    [findingsForGrid],
  );

  const resetAi = useCallback(() => {
    setAiResult(null);
    setAiError(null);
    setAiLoading(false);
  }, []);

  /** Quick scans hide Checklist; don't render that panel if state is stale. */
  const activeTabResolved: ScanTabId = useMemo(() => {
    if (result?.mode === "quick" && activeTab === "checklist") {
      return "findings";
    }
    return activeTab;
  }, [result?.mode, activeTab]);

  async function runScan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    resetAi();
    setLoading(true);
    setHasScanned(true);
    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, mode: scanMode }),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof body === "object" &&
          body !== null &&
          "error" in body &&
          typeof (body as { error: unknown }).error === "string"
            ? (body as { error: string }).error
            : `Error de escaneo (${response.status}).`;
        setError(message);
        return;
      }
      setResult(body as ScanResponseBody);
      setActiveTab("overview");
    } catch {
      setError("Error de red — inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const generateInsights = useCallback(
    async (opts?: { forceRefresh?: boolean; navigateToAi?: boolean }) => {
      if (!result || loading) return;
      setAiLoading(true);
      setAiError(null);
      try {
      const checklistRowsBuilt = buildChecklistRows(findingsForGrid).map(
        (r) => ({
          id: r.id,
          label: r.label,
          status: r.status,
          ...(r.detail ? { detail: r.detail } : {}),
        }),
      );

      const body = {
        normalizedTarget: result.normalizedTarget,
        inputKind: result.inputKind,
        scanMode: result.mode,
        totalHostnames: hostAggregate.total,
        hostnameSampleShownCount: hostAggregate.hostnames.length,
        findings: findingsForGrid.map((f) => ({
          id: f.id,
          module: f.module,
          severity: f.severity,
          title: f.title,
          explanation: f.explanation,
        })),
        checklistRows:
          result.mode === "quick"
            ? undefined
            : checklistRowsBuilt.length > 0
              ? checklistRowsBuilt
              : undefined,
        modules: (result.modules ?? []).map((m) => ({
          name: m.name,
          status: m.status,
          ...(typeof m.durationMs === "number" ? { durationMs: m.durationMs } : {}),
          ...(m.errorMessage ? { errorMessage: m.errorMessage } : {}),
        })),
      };

      const response = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof (payload as { error: unknown }).error === "string"
            ? (payload as { error: string }).error
            : `Error de insights (${response.status}).`;
        setAiError(message);
        return;
      }
      if (!isAiInsightsResponseBody(payload)) {
        setAiError("Respuesta de IA inválida.");
        return;
      }
      setAiResult(payload);
      if (opts?.navigateToAi !== false) {
        setActiveTab("ai");
      }
    } catch {
      setAiError("Error de red — inténtalo de nuevo.");
    } finally {
      setAiLoading(false);
    }
  },
  [
    findingsForGrid,
    hostAggregate.hostnames.length,
    hostAggregate.total,
    loading,
    result,
  ],
);

  const displayTarget =
    result?.normalizedTarget?.trim() ||
    result?.target?.trim() ||
    target.trim() ||
    "";

  const moduleRows = result?.modules ?? [];
  const perFindingMap = aiResult?.perFindingInsightsById ?? null;
  const checklistRowMap = aiResult?.checklistRowInsightsById ?? null;
  const showResults = hasScanned && !loading && result;
  /** Pre-scan: focused hero form. After first submit, show dashboard tabs. */
  const showScanTabs = hasScanned || loading;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      {showScanTabs ? (
        <ScanTabs
          active={activeTabResolved}
          onChange={setActiveTab}
          disabled={loading}
          hasResults={Boolean(result)}
          showChecklistTab={!result || result.mode !== "quick"}
        />
      ) : null}

      <div
        className={cn(showScanTabs && "mt-8")}
        role="tabpanel"
      >
        {activeTabResolved === "scan" ? (
          <div
            className={cn(
              "transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none",
              !showScanTabs &&
                "flex min-h-[60vh] flex-col justify-center motion-reduce:transform-none",
            )}
          >
            <ScanFormPanel
              target={target}
              onTargetChange={setTarget}
              scanMode={scanMode}
              onScanModeChange={setScanMode}
              onSubmit={runScan}
              loading={loading}
              error={error}
              authLoaded={authLoaded}
              isAuthenticated={Boolean(isSignedIn)}
            />
            {loading ? (
              <div className="mt-8">
                <SkeletonGrid />
              </div>
            ) : null}
          </div>
        ) : null}
        {loading && activeTabResolved !== "scan" ? (
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              Ejecutando comprobaciones pasivas
            </p>
            <p className="font-mono text-sm font-medium text-foreground break-all">
              {displayTarget || target.trim() || "—"}
            </p>
            <SkeletonGrid />
          </div>
        ) : null}

        {activeTabResolved === "overview" && showResults ? (
          <ScanOverviewPanel
            normalizedTarget={displayTarget}
            findings={findingsForGrid}
            modules={moduleRows}
            totalHostnames={hostAggregate.total}
            aiResult={aiResult}
            aiLoading={aiLoading}
            aiDisabled={loading}
            onGenerateInsights={() =>
              void generateInsights({ navigateToAi: false })
            }
            onGoToFindingsTab={() => setActiveTab("findings")}
            showChecklistDeepDive={result.mode !== "quick"}
          />
        ) : null}

        {activeTabResolved === "assets" && showResults ? (
          <AssetsColumn
            displayTarget={displayTarget}
            normalizedTarget={result.normalizedTarget}
            inputKind={result.inputKind}
            modules={moduleRows}
            hostnames={hostAggregate.hostnames}
            totalHostnames={hostAggregate.total}
          />
        ) : null}

        {activeTabResolved === "findings" && showResults ? (
          <div className="space-y-8">
            <RiskColumn
              findings={findingsForGrid}
              perFindingInsightsById={perFindingMap}
            />
            <AllFindingsPanel
              findings={findingsForGrid}
              perFindingInsightsById={perFindingMap}
            />
          </div>
        ) : null}

        {activeTabResolved === "checklist" && showResults ? (
          <ChecklistColumn
            findings={findingsForGrid}
            checklistRowInsightsById={checklistRowMap}
            perFindingInsightsById={perFindingMap}
          />
        ) : null}

        {activeTabResolved === "ai" && showResults ? (
          <AiInsightsColumn
            loading={aiLoading}
            error={aiError}
            result={aiResult}
            disabled={loading}
            onGenerate={(opts) =>
              void generateInsights({ ...opts, navigateToAi: true })
            }
          />
        ) : null}

        {activeTabResolved !== "scan" && !loading && hasScanned && !result ? (
          <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
            El escaneo no devolvió resultados. Vuelve a la pestaña Escaneo o
            revisa el error.
          </p>
        ) : null}
      </div>
    </div>
  );
}
