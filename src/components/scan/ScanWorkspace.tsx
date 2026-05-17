"use client";

import { AiInsightsColumn } from "@/components/dashboard/AiInsightsColumn";
import { AllFindingsPanel } from "@/components/dashboard/AllFindingsPanel";
import { AssetsColumn } from "@/components/dashboard/AssetsColumn";
import { ChecklistColumn } from "@/components/dashboard/ChecklistColumn";
import { RiskColumn } from "@/components/dashboard/RiskColumn";
import { ScanLoadingSkeleton } from "@/components/dashboard/SkeletonGrid";
import { Card, CardContent } from "@/components/ui/card";
import { ScanHistorySidebar } from "@/components/scan/ScanHistorySidebar";
import {
  aggregateHostnamesFromFindings,
  buildChecklistRows,
} from "@/lib/dashboard/findings";
import type { AiInsightsResponseBody } from "@/types/ai-insights";
import type { ScanResponseBody } from "@/types/scan";
import { useAuth } from "@clerk/nextjs";
import { anyApi } from "convex/server";
import type { GenericId } from "convex/values";
import { useMutation } from "convex/react";
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

function parseScanPayload(body: unknown): ScanResponseBody | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const target = typeof b.target === "string" ? b.target : "";
  const normalizedTarget =
    typeof b.normalizedTarget === "string" ? b.normalizedTarget : "";
  const inputKind = b.inputKind;
  const findingsRaw = b.findings;
  const modulesRaw = b.modules;
  const findings = Array.isArray(findingsRaw) ? findingsRaw : [];
  const modules = Array.isArray(modulesRaw) ? modulesRaw : [];
  const scanMode =
    b.scanMode === "deep" || b.scanMode === "quick" ? b.scanMode : undefined;
  const kindOk =
    inputKind === "domain" || inputKind === "ip" || inputKind === "unknown";
  if (!target || !normalizedTarget || !kindOk || !scanMode) {
    return null;
  }
  return {
    target,
    normalizedTarget,
    inputKind,
    findings: findings as ScanResponseBody["findings"],
    modules: modules as ScanResponseBody["modules"],
    scanMode,
  };
}

function stripInsightsForStorage(
  x: AiInsightsResponseBody & { cached?: boolean },
): AiInsightsResponseBody {
  const { cached: _omit, ...rest } = x;
  void _omit;
  return rest;
}

export function ScanWorkspace() {
  const { isSignedIn, isLoaded } = useAuth();
  const isAuthenticated = Boolean(isSignedIn);

  const createScanConvex = useMutation(anyApi.scans.createScan);
  const updateInsightsConvex = useMutation(anyApi.scans.updateScanInsights);

  const [target, setTarget] = useState("");
  const [scanMode, setScanMode] = useState<ScanMode>("deep");
  const [historyOpen, setHistoryOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<ScanTabId>("scan");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResponseBody | null>(null);

  const [scanConvexId, setScanConvexId] = useState<
    GenericId<"scans"> | null | undefined
  >(undefined);

  const [hasScanned, setHasScanned] = useState(false);

  const [aiResult, setAiResult] = useState<AiInsightsResponseBody | null>(null);
  const [aiFromCacheFlag, setAiFromCacheFlag] = useState(false);
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
    setAiFromCacheFlag(false);
  }, []);

  const persistScanConvex = useCallback(
    async (payload: ScanResponseBody) => {
      if (!isLoaded || !isAuthenticated) return;
      try {
        const id = await createScanConvex({
          target: payload.target,
          normalizedTarget: payload.normalizedTarget,
          inputKind: payload.inputKind,
          scanMode: payload.scanMode,
          findings: payload.findings as unknown[],
          modules: payload.modules as unknown[],
        });
        setScanConvexId(id);
      } catch (e) {
        console.error("Convex createScan failed:", e);
      }
    },
    [createScanConvex, isAuthenticated, isLoaded],
  );

  const restoreHistoricScan = useCallback(
    (
      payload: ScanResponseBody,
      options: {
        convexScanId: GenericId<"scans">;
        aiInsights: AiInsightsResponseBody | null;
      },
    ) => {
      setHistoryOpen(false);
      setHasScanned(true);
      setError(null);
      setLoading(false);
      setResult(payload);
      setScanConvexId(options.convexScanId);
      setActiveTab("findings");

      resetAi();
      if (options.aiInsights) {
        setAiFromCacheFlag(false);
        setAiResult(stripInsightsForStorage(options.aiInsights));
        setActiveTab("ai");
      }
    },
    [resetAi],
  );

  async function runScan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    resetAi();
    setScanConvexId(undefined);
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

      const parsed = parseScanPayload(body);
      if (!parsed) {
        setError(
          "La respuesta del escaneo no era válida. Inténtalo de nuevo.",
        );
        return;
      }

      setResult(parsed);
      setActiveTab(scanMode === "quick" ? "findings" : "assets");
      await persistScanConvex(parsed);
    } catch {
      setError("Error de red — inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const generateInsights = useCallback(
    async (opts?: { forceRefresh?: boolean }) => {
      if (!result || loading) return;
      setAiLoading(true);
      setAiError(null);
      try {
        const checklistRows = buildChecklistRows(findingsForGrid).map((r) => ({
          id: r.id,
          label: r.label,
          status: r.status,
          ...(r.detail ? { detail: r.detail } : {}),
        }));

        const body = {
          normalizedTarget: result.normalizedTarget,
          inputKind: result.inputKind,
          forceRefresh: Boolean(opts?.forceRefresh),
          totalHostnames: hostAggregate.total,
          hostnameSampleShownCount: hostAggregate.hostnames.length,
          findings: findingsForGrid.map((f) => ({
            id: f.id,
            module: f.module,
            severity: f.severity,
            title: f.title,
            explanation: f.explanation,
          })),
          checklistRows: checklistRows.length > 0 ? checklistRows : undefined,
          modules: (result.modules ?? []).map((m) => ({
            name: m.name,
            status: m.status,
            ...(typeof m.durationMs === "number"
              ? { durationMs: m.durationMs }
              : {}),
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

        const cacheHit = payload.cached === true;
        const stored = stripInsightsForStorage(payload);

        setAiResult(stored);
        setAiFromCacheFlag(Boolean(cacheHit));
        setActiveTab("ai");

        if (isAuthenticated && scanConvexId) {
          try {
            await updateInsightsConvex({
              scanId: scanConvexId,
              aiInsights: stored,
            });
          } catch (e) {
            console.warn("Convex updateScanInsights skipped:", e);
          }
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
      isAuthenticated,
      loading,
      result,
      scanConvexId,
      updateInsightsConvex,
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

  return (
    <div className="relative pb-28">
      {isAuthenticated ? (
        <ScanHistorySidebar
          open={historyOpen}
          setOpen={setHistoryOpen}
          onRestoreScan={restoreHistoricScan}
        />
      ) : null}

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <ScanTabs
          active={activeTab}
          onChange={setActiveTab}
          disabled={loading}
          hasResults={Boolean(result)}
        />

        <div className="mt-8" role="tabpanel">
          {activeTab === "scan" ? (
            <ScanFormPanel
              target={target}
              onTargetChange={setTarget}
              scanMode={scanMode}
              onScanModeChange={setScanMode}
              onSubmit={runScan}
              loading={loading}
              error={error}
              authLoaded={isLoaded}
              isAuthenticated={isAuthenticated}
            />
          ) : null}

          {loading ? (
            <div className={activeTab === "scan" ? "mt-8" : undefined}>
              <ScanLoadingSkeleton
                showHeading={activeTab !== "scan"}
                domainLabel={
                  (displayTarget || target.trim()).trim() || undefined
                }
              />
            </div>
          ) : (
            <>
              {activeTab === "assets" && showResults ? (
                <AssetsColumn
                  displayTarget={displayTarget}
                  normalizedTarget={result.normalizedTarget}
                  inputKind={result.inputKind}
                  modules={moduleRows}
                  hostnames={hostAggregate.hostnames}
                  totalHostnames={hostAggregate.total}
                />
              ) : null}

              {activeTab === "findings" && showResults ? (
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

              {activeTab === "checklist" && showResults ? (
                <ChecklistColumn
                  findings={findingsForGrid}
                  checklistRowInsightsById={checklistRowMap}
                  perFindingInsightsById={perFindingMap}
                />
              ) : null}

              {activeTab === "ai" && showResults ? (
                <AiInsightsColumn
                  loading={aiLoading}
                  error={aiError}
                  result={aiResult}
                  servedFromCache={aiFromCacheFlag}
                  disabled={loading}
                  onGenerate={generateInsights}
                />
              ) : null}

              {activeTab !== "scan" && hasScanned && !result ? (
                <Card className="neon-panel shadow-none ring-0">
                  <CardContent className="p-6">
                    <p className="text-sm text-slate-500">
                      El escaneo no devolvió resultados. Vuelve a la pestaña Escaneo
                      o revisa el error.
                    </p>
                  </CardContent>
                </Card>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
