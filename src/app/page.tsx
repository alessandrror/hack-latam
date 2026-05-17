"use client";

import { AiInsightsColumn } from "@/components/dashboard/AiInsightsColumn";
import { AssetsColumn } from "@/components/dashboard/AssetsColumn";
import { ChecklistColumn } from "@/components/dashboard/ChecklistColumn";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { RiskColumn } from "@/components/dashboard/RiskColumn";
import { SearchHero } from "@/components/dashboard/SearchHero";
import { SkeletonGrid } from "@/components/dashboard/SkeletonGrid";
import { TopNav } from "@/components/dashboard/TopNav";
import {
  aggregateHostnamesFromFindings,
  buildChecklistRows,
} from "@/lib/dashboard/findings";
import type { AiInsightsResponseBody } from "@/types/ai-insights";
import type { ScanResponseBody } from "@/types/scan";
import { useCallback, useMemo, useState, type FormEvent } from "react";

function isAiInsightsResponseBody(x: unknown): x is AiInsightsResponseBody {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (
    typeof o.executiveSummary !== "string" ||
    !Array.isArray(o.topActions) ||
    !Array.isArray(o.disclaimers) ||
    typeof o.perFindingInsightsById !== "object" ||
    o.perFindingInsightsById === null
  ) {
    return false;
  }
  return true;
}

export default function Home() {
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResponseBody | null>(null);
  const [dashboardMode, setDashboardMode] = useState(false);
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

  function resetToHero() {
    setDashboardMode(false);
    setResult(null);
    setError(null);
    setLoading(false);
    resetAi();
  }

  async function runScan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    resetAi();
    setLoading(true);
    setDashboardMode(true);
    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof body === "object" &&
          body !== null &&
          "error" in body &&
          typeof (body as { error: unknown }).error === "string"
            ? (body as { error: string }).error
            : `Scan failed (${response.status}).`;
        setError(message);
        return;
      }
      setResult(body as ScanResponseBody);
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  const generateInsights = useCallback(async () => {
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
            : `Insights failed (${response.status}).`;
        setAiError(message);
        return;
      }
      if (!isAiInsightsResponseBody(payload)) {
        setAiError("Invalid insights response.");
        return;
      }
      setAiResult(payload);
    } catch {
      setAiError("Network error — try again.");
    } finally {
      setAiLoading(false);
    }
  }, [
    findingsForGrid,
    hostAggregate.hostnames.length,
    hostAggregate.total,
    loading,
    result,
  ]);

  const displayTarget =
    result?.normalizedTarget?.trim() ||
    result?.target?.trim() ||
    target.trim() ||
    "";

  const moduleRows = result?.modules ?? [];

  const perFindingMap = aiResult?.perFindingInsightsById ?? null;
  const checklistRowMap = aiResult?.checklistRowInsightsById ?? null;

  return (
    <div className="min-h-full bg-slate-950 text-slate-50">
      {dashboardMode ? (
        <TopNav
          target={target}
          onTargetChange={setTarget}
          onSubmit={runScan}
          loading={loading}
          error={error}
          onNewScan={resetToHero}
        />
      ) : null}

      {!dashboardMode ? (
        <main className="mx-auto max-w-5xl">
          <SearchHero
            target={target}
            onTargetChange={setTarget}
            onSubmit={runScan}
            loading={loading}
            error={error}
          />
        </main>
      ) : (
        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6">
          {loading ? (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Scanning
              </p>
              <p className="font-mono text-sm font-medium text-emerald-400 break-all">
                {displayTarget || target.trim() || "—"}
              </p>
              <SkeletonGrid />
            </div>
          ) : (
            <DashboardGrid>
              <AssetsColumn
                displayTarget={displayTarget}
                normalizedTarget={result?.normalizedTarget}
                inputKind={result?.inputKind}
                modules={moduleRows}
                hostnames={hostAggregate.hostnames}
                totalHostnames={hostAggregate.total}
              />
              <RiskColumn
                findings={findingsForGrid}
                perFindingInsightsById={perFindingMap}
              />
              <ChecklistColumn
                findings={findingsForGrid}
                checklistRowInsightsById={checklistRowMap}
                perFindingInsightsById={perFindingMap}
              />
              <AiInsightsColumn
                loading={aiLoading}
                error={aiError}
                result={aiResult}
                disabled={loading}
                onGenerate={generateInsights}
              />
            </DashboardGrid>
          )}
        </main>
      )}
    </div>
  );
}
