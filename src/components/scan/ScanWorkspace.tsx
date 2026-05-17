"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { History } from "lucide-react";
import { AiInsightsColumn } from "@/components/dashboard/AiInsightsColumn";
import { AllFindingsPanel } from "@/components/dashboard/AllFindingsPanel";
import { AssetsColumn } from "@/components/dashboard/AssetsColumn";
import { ChecklistColumn } from "@/components/dashboard/ChecklistColumn";
import { RiskColumn } from "@/components/dashboard/RiskColumn";
import { ScanOverviewPanel } from "@/components/dashboard/ScanOverviewPanel";
import { SkeletonGrid } from "@/components/dashboard/SkeletonGrid";
import { clearChatMessages, chatSessionStorageKey } from "@/lib/ai/chat-session-storage";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { aggregateHostnamesFromFindings } from "@/lib/dashboard/findings";
import { buildInsightsRequestBody } from "@/lib/dashboard/insights-payload";
import {
  appendScanSessionHistoryEntry,
  loadScanSessionHistory,
  persistScanSessionHistory,
  type ScanSessionHistoryEntry,
} from "@/lib/scan/scanSessionHistory";
import { extractApexFromNormalizedHost } from "@/lib/recon/extract-apex";
import { classifyAndNormalizeTarget } from "@/lib/recon/normalize-target";
import { cn } from "@/lib/utils";
import type { AiInsightsResponseBody } from "@/types/ai-insights";
import type { ScanResponseBody } from "@/types/scan";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import { api } from "../../../convex/_generated/api";

import { ScanFormPanel, type ScanMode } from "./ScanFormPanel";
import { ScanHistorySidebar } from "./ScanHistorySidebar";
import { ScanMainStart } from "./ScanMainEmpty";
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
  const [activeTab, setActiveTab] = useState<ScanTabId>("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResponseBody | null>(null);
  const [aiResult, setAiResult] = useState<AiInsightsResponseBody | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [relatedEmails, setRelatedEmails] = useState("");
  const [history, setHistory] = useState<ScanSessionHistoryEntry[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    queueMicrotask(() => {
      setHistory(loadScanSessionHistory());
    });
  }, []);

  const findingsForGrid = useMemo(
    () => result?.findings ?? [],
    [result?.findings],
  );
  const hostAggregate = useMemo(
    () => aggregateHostnamesFromFindings(findingsForGrid),
    [findingsForGrid],
  );

  const classifiedTarget = useMemo(
    () => classifyAndNormalizeTarget(target),
    [target],
  );
  const apexDomain = useMemo(() => {
    if (classifiedTarget.kind !== "domain") return null;
    return extractApexFromNormalizedHost(classifiedTarget.normalized);
  }, [classifiedTarget]);

  const verification = useQuery(
    api.verifiedDomains.getStatus,
    authLoaded && isSignedIn && apexDomain
      ? { domain: apexDomain }
      : "skip",
  );

  const resetAi = useCallback(() => {
    setAiResult(null);
    setAiError(null);
    setAiLoading(false);
  }, []);

  const activeTabResolved: ScanTabId = useMemo(() => {
    if (result?.mode === "quick" && activeTab === "checklist") {
      return "findings";
    }
    return activeTab;
  }, [result?.mode, activeTab]);

  const handleTabChange = useCallback((id: ScanTabId) => {
    setActiveTab(id);
    setMobileSidebarOpen(false);
  }, []);

  const handleNewScan = useCallback(() => {
    setResult(null);
    resetAi();
    setError(null);
    setActiveTab("overview");
    setSelectedHistoryId(null);
    setMobileSidebarOpen(false);
    setRelatedEmails("");
  }, [resetAi]);

  const handleSelectHistory = useCallback(
    (entry: ScanSessionHistoryEntry) => {
      setResult(entry.result);
      setTarget(entry.inputTarget);
      setScanMode(entry.mode);
      resetAi();
      setError(null);
      setActiveTab("overview");
      setSelectedHistoryId(entry.id);
      setMobileSidebarOpen(false);
      setRelatedEmails("");
    },
    [resetAi],
  );

  const historySidebar = useMemo(
    () => (
      <ScanHistorySidebar
        entries={history}
        selectedId={selectedHistoryId}
        onSelect={handleSelectHistory}
        onNewScan={handleNewScan}
        newScanDisabled={!result && !loading}
      />
    ),
    [history, selectedHistoryId, handleSelectHistory, handleNewScan, result, loading],
  );

  const runScanCore = useCallback(async () => {
    setError(null);
    setResult(null);
    resetAi();
    if (result?.normalizedTarget) {
      clearChatMessages(
        chatSessionStorageKey(
          result.normalizedTarget,
          result.mode ?? "deep",
        ),
      );
    }
    setLoading(true);
    setSelectedHistoryId(null);
    try {
      const scanBody: Record<string, unknown> = { target, mode: scanMode };
      if (relatedEmails.trim()) {
        scanBody.emails = relatedEmails;
      }

      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scanBody),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const o = body as Record<string, unknown>;
        const message =
          typeof o.error === "string"
            ? o.error
            : `Error de escaneo (${response.status}).`;
        setError(message);
        return;
      }
      const scanResult = body as ScanResponseBody;
      setResult(scanResult);
      setActiveTab("overview");
      setMobileSidebarOpen(false);

      setHistory((prev) => {
        const { entries, newId } = appendScanSessionHistoryEntry(prev, {
          inputTarget: target,
          mode: scanMode,
          result: scanResult,
        });
        persistScanSessionHistory(entries);
        queueMicrotask(() => {
          setSelectedHistoryId(newId);
        });
        return entries;
      });
    } catch {
      setError("Error de red — inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [resetAi, result, scanMode, target, relatedEmails]);

  async function runScan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runScanCore();
  }

  const handleOwnershipVerified = useCallback(() => {
    void runScanCore();
  }, [runScanCore]);

  const scanSnapshot = useMemo(() => {
    if (!result) return null;
    return buildInsightsRequestBody({
      result,
      findings: findingsForGrid,
      totalHostnames: hostAggregate.total,
      hostnameSampleShownCount: hostAggregate.hostnames.length,
    });
  }, [findingsForGrid, hostAggregate.hostnames.length, hostAggregate.total, result]);

  const generateInsights = useCallback(
    async (opts?: { forceRefresh?: boolean; navigateToAi?: boolean }) => {
      if (!result || loading || !scanSnapshot) return;
      setAiLoading(true);
      setAiError(null);
      try {
        const response = await fetch("/api/ai/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(scanSnapshot),
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
    [loading, result, scanSnapshot],
  );

  const handleFindingCitationClick = useCallback((findingId: string) => {
    setActiveTab("findings");
    requestAnimationFrame(() => {
      document
        .getElementById(`finding-${findingId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, []);

  const displayTarget =
    result?.normalizedTarget?.trim() ||
    result?.target?.trim() ||
    target.trim() ||
    "";

  const moduleRows = result?.modules ?? [];
  const perFindingMap = aiResult?.perFindingInsightsById ?? null;
  const checklistRowMap = aiResult?.checklistRowInsightsById ?? null;
  const showResults = Boolean(result) && !loading;
  const showChecklistTab = !result || result.mode !== "quick";
  const resolvedResult = result;
  const showForm = !result && !loading;

  const resultsPanel: ReactNode = (() => {
    if (!showResults || !resolvedResult) return null;

    if (activeTabResolved === "overview") {
      return (
        <ScanOverviewPanel
          normalizedTarget={displayTarget}
          emailDomainSummary={resolvedResult.emailDomainSummary}
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
          showChecklistDeepDive={resolvedResult.mode !== "quick"}
        />
      );
    }

    if (activeTabResolved === "assets") {
      return (
        <AssetsColumn
          displayTarget={displayTarget}
          normalizedTarget={resolvedResult.normalizedTarget}
          inputKind={resolvedResult.inputKind}
          modules={moduleRows}
          hostnames={hostAggregate.hostnames}
          totalHostnames={hostAggregate.total}
        />
      );
    }

    if (activeTabResolved === "findings") {
      return (
        <div className="space-y-8 px-5 py-10 sm:px-8 lg:space-y-10 lg:px-12 lg:py-14">
          <RiskColumn
            findings={findingsForGrid}
            perFindingInsightsById={perFindingMap}
          />
          <AllFindingsPanel
            findings={findingsForGrid}
            perFindingInsightsById={perFindingMap}
          />
        </div>
      );
    }

    if (activeTabResolved === "checklist") {
      return (
        <ChecklistColumn
          findings={findingsForGrid}
          checklistRowInsightsById={checklistRowMap}
          perFindingInsightsById={perFindingMap}
        />
      );
    }

    if (activeTabResolved === "ai") {
      return (
        <AiInsightsColumn
          loading={aiLoading}
          error={aiError}
          result={aiResult}
          disabled={loading}
          onGenerate={(opts) =>
            void generateInsights({ ...opts, navigateToAi: true })
          }
          scanSnapshot={scanSnapshot}
          isSignedIn={Boolean(isSignedIn)}
          authLoaded={authLoaded}
          onFindingCitationClick={handleFindingCitationClick}
        />
      );
    }

    return null;
  })();

  const mainBody: ReactNode = (() => {
    if (loading) {
      return (
        <div className="space-y-4 px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Ejecutando comprobaciones pasivas
          </p>
          <p className="font-mono text-sm font-medium break-all text-foreground">
            {displayTarget || target.trim() || "—"}
          </p>
          <SkeletonGrid />
        </div>
      );
    }

    if (showForm) {
      return (
        <ScanMainStart>
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
            targetKind={classifiedTarget.kind}
            apexDomain={apexDomain}
            verification={
              verification === undefined
                ? undefined
                : verification === null
                  ? null
                  : {
                      status: verification.status,
                      method: verification.method,
                      ...(verification.token !== undefined
                        ? { token: verification.token }
                        : {}),
                      ...(verification.failureReason
                        ? { failureReason: verification.failureReason }
                        : {}),
                    }
            }
            onOwnershipVerified={handleOwnershipVerified}
            relatedEmails={relatedEmails}
            onRelatedEmailsChange={setRelatedEmails}
          />
        </ScanMainStart>
      );
    }

    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div
          className={cn(
            "sticky top-0 z-10 border-b border-border/40 bg-background/90 px-4 py-3 backdrop-blur-md",
            "sm:px-6 lg:px-8",
          )}
        >
          <ScanTabs
            active={activeTabResolved}
            onChange={handleTabChange}
            disabled={loading}
            hasResults={Boolean(result)}
            showChecklistTab={showChecklistTab}
          />
        </div>
        <div className="min-h-0 flex-1">{resultsPanel}</div>
      </div>
    );
  })();

  return (
    <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <div className="flex shrink-0 items-center border-b border-border/40 px-3 py-2 lg:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-expanded={mobileSidebarOpen}
            aria-controls="scan-mobile-history"
            className="gap-2 touch-manipulation rounded-full border-border/50 bg-muted/25 shadow-none"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <History className="size-4" aria-hidden />
            Historial
          </Button>
        </div>

        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row",
          )}
        >
          <aside
            className={cn(
              "hidden w-72 shrink-0 flex-col border-border/50 bg-muted/20 dark:bg-muted/10 lg:flex",
              "lg:min-h-0 lg:border-r lg:overflow-y-auto",
            )}
            aria-label="Historial de escaneos de esta sesión"
          >
            <div className="flex flex-col px-4 py-5 lg:px-5 lg:py-6">
              {historySidebar}
            </div>
          </aside>

          <section
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-background",
            )}
            aria-label="Vista principal del escaneo"
          >
            {mainBody}
          </section>
        </div>
      </div>

      <SheetContent
        side="left"
        showCloseButton
        className="flex w-[min(100vw-1rem,20rem)] max-w-none flex-col gap-6 border-border/40 bg-popover px-5 py-8 shadow-none sm:w-80 md:max-w-[20rem]"
        id="scan-mobile-history"
        aria-labelledby="scan-sheet-title"
      >
        <SheetHeader className="gap-2 border-b border-border/40 p-0 pb-4 text-left">
          <SheetTitle id="scan-sheet-title" className="text-base">
            Historial de esta sesión
          </SheetTitle>
        </SheetHeader>
        {historySidebar}
      </SheetContent>
    </Sheet>
  );
}
