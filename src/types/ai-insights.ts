/** Priority for remediation ordering (aligned with ScanFinding severity where applicable). */
export type AiInsightsActionPriority = "critical" | "medium" | "low";

export type AiInsightsConfidence = "high" | "medium" | "low";

/** One prioritized defensive action grounded in scan results. */
export interface AiInsightsTopAction {
  id: string;
  priority: AiInsightsActionPriority;
  title: string;
  why: string;
  verifyStep: string;
  confidence: AiInsightsConfidence;
  relatedFindingIds?: string[];
}

/** Short contextual insight for one finding (`ScanFinding.id`). */
export interface AiPerFindingInsight {
  meaning: string;
  verifyStep?: string;
}

/** Same shape for aggregated checklist rows (`ChecklistRow.id`). */
export interface AiInsightsResponseBody {
  executiveSummary: string;
  topActions: AiInsightsTopAction[];
  disclaimers: string[];
  perFindingInsightsById: Record<string, AiPerFindingInsight>;
  /** Keys should match checklist row ids, e.g. `check-spf`, `check-dmarc`. */
  checklistRowInsightsById?: Record<string, AiPerFindingInsight>;
  /** Server-set: actual model slug used (after retries). */
  modelUsed?: string;
}

/** Minimal payload from client/server for LLM (no hostname bulk, no metadata). */
export interface AiInsightsMinimalFindingInput {
  id: string;
  module: string;
  severity: string;
  title: string;
  explanation: string;
}

export interface AiInsightsMinimalModuleInput {
  name: string;
  status: string;
  durationMs?: number;
  errorMessage?: string;
}

/** POST body from client to `/api/ai/insights`. */
export interface AiInsightsRequestBody {
  normalizedTarget: string;
  inputKind: string;
  /** Count only — no hostname list sent to model. */
  totalHostnames: number;
  /** How many distinct hostnames are shown in UI (still not enumerated to model unless present). */
  hostnameSampleShownCount: number;
  findings: AiInsightsMinimalFindingInput[];
  checklistRows?: Array<{
    id: string;
    label: string;
    status: string;
    detail?: string;
  }>;
  modules: AiInsightsMinimalModuleInput[];
}
