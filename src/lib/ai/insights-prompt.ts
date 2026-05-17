import type {
  AiInsightsRequestBody,
  AiInsightsResponseBody,
  AiPerFindingInsight,
  AiInsightsTopAction,
  AiInsightsConfidence,
} from "@/types/ai-insights";
import { DEFENSIVE_ADVISOR_RULES, getScanModeContextBlock } from "./defensive-rules";

const INSIGHTS_JSON_SHAPE = `Output MUST be valid JSON only, no markdown fences, no commentary before or after the JSON object.
- Use the finding ids exactly as provided in input for keys in perFindingInsightsById and relatedFindingIds.
- For checklistRowInsightsById use these keys when relevant: check-spf, check-dmarc, check-dkim, check-caa, check-cert, check-tls-versions (omit unknown keys).

JSON shape:
{
  "executiveSummary": string,
  "topActions": array of { "id": string, "priority": "critical"|"medium"|"low", "title": string, "why": string, "verifyStep": string, "confidence": "high"|"medium"|"low", "relatedFindingIds": string[] optional },
  "disclaimers": string[],
  "perFindingInsightsById": { "<findingId>": { "meaning": string, "verifyStep": string optional } },
  "checklistRowInsightsById": optional object with same inner shape keyed by checklist row id
}`;

export function buildUserPrompt(context: AiInsightsRequestBody): string {
  const payload = {
    normalizedTarget: context.normalizedTarget,
    inputKind: context.inputKind,
    scanMode: context.scanMode ?? "deep",
    subdomainSummary: {
      totalHostnamesReported: context.totalHostnames,
      hostnameSampleShownCount: context.hostnameSampleShownCount,
      note:
        "Do not enumerate or guess individual hostnames; only refer to totals if useful.",
    },
    modules: context.modules,
    checklistRows: context.checklistRows ?? [],
    findings: context.findings,
  };

  return `Analyze the following passive scan snapshot and produce the JSON object described in your instructions.

INPUT_JSON:
${JSON.stringify(payload)}`;
}

export function getInsightsSystemPrompt(
  scanMode: "deep" | "quick" = "deep",
): string {
  return `${DEFENSIVE_ADVISOR_RULES}
${getScanModeContextBlock(scanMode)}

${INSIGHTS_JSON_SHAPE}`;
}

function isSeverityLike(
  s: unknown,
): s is AiInsightsTopAction["priority"] {
  return s === "critical" || s === "medium" || s === "low";
}

function isConfidenceLike(s: unknown): s is AiInsightsConfidence {
  return s === "high" || s === "medium" || s === "low";
}

function parsePerFindingInsights(
  raw: unknown,
): Record<string, AiPerFindingInsight> {
  const out: Record<string, AiPerFindingInsight> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [key, val] of Object.entries(raw)) {
    if (
      val &&
      typeof val === "object" &&
      typeof (val as { meaning: unknown }).meaning === "string"
    ) {
      const verify =
        typeof (val as { verifyStep: unknown }).verifyStep === "string"
          ? (val as { verifyStep: string }).verifyStep
          : undefined;
      out[key] = {
        meaning: (val as { meaning: string }).meaning,
        verifyStep: verify,
      };
    }
  }
  return out;
}

function parseTopActions(raw: unknown): AiInsightsTopAction[] {
  if (!Array.isArray(raw)) return [];
  const out: AiInsightsTopAction[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (
      typeof o.id !== "string" ||
      typeof o.title !== "string" ||
      typeof o.why !== "string" ||
      typeof o.verifyStep !== "string" ||
      !isSeverityLike(o.priority) ||
      !isConfidenceLike(o.confidence)
    ) {
      continue;
    }
    const related =
      Array.isArray(o.relatedFindingIds) &&
      o.relatedFindingIds.every((x) => typeof x === "string")
        ? (o.relatedFindingIds as string[])
        : undefined;
    out.push({
      id: o.id,
      priority: o.priority,
      title: o.title,
      why: o.why,
      verifyStep: o.verifyStep,
      confidence: o.confidence,
      relatedFindingIds: related,
    });
  }
  return out;
}

function parseDisclaimers(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x): x is string => typeof x === "string" && x.trim().length > 0,
  );
}

/** Strip optional markdown code fences and parse JSON object. */
export function parseInsightsModelOutput(text: string): AiInsightsResponseBody {
  let s = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```\s*$/m.exec(s);
  if (fence) s = fence[1].trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(s);
  } catch {
    throw new Error("Model output is not valid JSON.");
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof (parsed as { executiveSummary: unknown }).executiveSummary !==
      "string"
  ) {
    throw new Error("Missing executiveSummary.");
  }

  const p = parsed as Record<string, unknown>;
  const topActions = parseTopActions(p.topActions);
  let disclaimers = parseDisclaimers(p.disclaimers);
  const perFindingInsightsById = parsePerFindingInsights(
    p.perFindingInsightsById,
  );
  const checklistRowInsightsById =
    typeof p.checklistRowInsightsById === "object" &&
    p.checklistRowInsightsById !== null
      ? parsePerFindingInsights(p.checklistRowInsightsById)
      : undefined;

  if (disclaimers.length === 0) {
    disclaimers = [
      "These insights are informational and incomplete; passive scans cannot prove absence of issues.",
      "Verify all items in your own environment with authorized personnel.",
    ];
  }

  return {
    executiveSummary: p.executiveSummary as string,
    topActions,
    disclaimers,
    perFindingInsightsById,
    checklistRowInsightsById,
  };
}
