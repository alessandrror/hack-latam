import type {
  AiInsightsMinimalFindingInput,
  AiInsightsMinimalModuleInput,
  AiInsightsRequestBody,
} from "@/types/ai-insights";

function parseMinimalFinding(raw: unknown): AiInsightsMinimalFindingInput | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (
    typeof o.id !== "string" ||
    typeof o.module !== "string" ||
    typeof o.severity !== "string" ||
    typeof o.title !== "string" ||
    typeof o.explanation !== "string"
  ) {
    return null;
  }
  return {
    id: o.id,
    module: o.module,
    severity: o.severity,
    title: o.title,
    explanation: o.explanation,
  };
}

function parseMinimalModule(raw: unknown): AiInsightsMinimalModuleInput | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.name !== "string" || typeof o.status !== "string") return null;
  const durationMs =
    typeof o.durationMs === "number" && Number.isFinite(o.durationMs)
      ? o.durationMs
      : undefined;
  const errorMessage =
    typeof o.errorMessage === "string" ? o.errorMessage : undefined;
  return { name: o.name, status: o.status, durationMs, errorMessage };
}

/** Parse scan snapshot from flat body or nested `scanSnapshot`. */
export function parseScanSnapshot(payload: unknown): AiInsightsRequestBody | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const p =
    root.scanSnapshot && typeof root.scanSnapshot === "object"
      ? (root.scanSnapshot as Record<string, unknown>)
      : root;

  const normalizedTarget =
    typeof p.normalizedTarget === "string" ? p.normalizedTarget.trim() : "";
  const inputKind = typeof p.inputKind === "string" ? p.inputKind.trim() : "";
  const totalHostnames =
    typeof p.totalHostnames === "number" && Number.isFinite(p.totalHostnames)
      ? Math.max(0, Math.floor(p.totalHostnames))
      : 0;
  const hostnameSampleShownCount =
    typeof p.hostnameSampleShownCount === "number" &&
    Number.isFinite(p.hostnameSampleShownCount)
      ? Math.max(0, Math.floor(p.hostnameSampleShownCount))
      : 0;

  const rawScanMode =
    typeof p.scanMode === "string" ? p.scanMode.trim().toLowerCase() : "";
  const scanMode: "deep" | "quick" =
    rawScanMode === "quick" ? "quick" : "deep";

  const findingsRaw = p.findings;
  if (!Array.isArray(findingsRaw)) return null;

  const findings: AiInsightsMinimalFindingInput[] = [];
  for (const item of findingsRaw) {
    const f = parseMinimalFinding(item);
    if (f) findings.push(f);
  }

  const modulesRaw = p.modules;
  const modules: AiInsightsMinimalModuleInput[] = [];
  if (Array.isArray(modulesRaw)) {
    for (const item of modulesRaw) {
      const m = parseMinimalModule(item);
      if (m) modules.push(m);
    }
  }

  const checklistRows: NonNullable<AiInsightsRequestBody["checklistRows"]> = [];
  const cr = p.checklistRows;
  if (Array.isArray(cr)) {
    for (const row of cr) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      if (typeof r.id !== "string" || typeof r.label !== "string") continue;
      if (typeof r.status !== "string") continue;
      const detail = typeof r.detail === "string" ? r.detail : undefined;
      checklistRows.push({ id: r.id, label: r.label, status: r.status, detail });
    }
  }

  if (!normalizedTarget || !inputKind) {
    return null;
  }

  return {
    normalizedTarget,
    inputKind,
    scanMode,
    totalHostnames,
    hostnameSampleShownCount,
    findings,
    checklistRows: checklistRows.length > 0 ? checklistRows : undefined,
    modules,
  };
}

/** Trim long explanations when many findings (token control). */
export function trimScanSnapshotForChat(
  snapshot: AiInsightsRequestBody,
  maxFindings = 20,
  maxExplanationLen = 400,
): AiInsightsRequestBody {
  const findings = snapshot.findings.slice(0, maxFindings).map((f) => ({
    ...f,
    explanation:
      f.explanation.length > maxExplanationLen
        ? `${f.explanation.slice(0, maxExplanationLen)}…`
        : f.explanation,
  }));
  return { ...snapshot, findings };
}
