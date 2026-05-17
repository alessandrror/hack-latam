import { buildChecklistRows } from "@/lib/dashboard/findings";
import type { AiInsightsRequestBody } from "@/types/ai-insights";
import type { ScanFinding, ScanResponseBody } from "@/types/scan";

export function buildInsightsRequestBody(params: {
  result: ScanResponseBody;
  findings: ScanFinding[];
  totalHostnames: number;
  hostnameSampleShownCount: number;
}): AiInsightsRequestBody {
  const { result, findings, totalHostnames, hostnameSampleShownCount } = params;
  const checklistRowsBuilt = buildChecklistRows(findings).map((r) => ({
    id: r.id,
    label: r.label,
    status: r.status,
    ...(r.detail ? { detail: r.detail } : {}),
  }));

  return {
    normalizedTarget: result.normalizedTarget,
    inputKind: result.inputKind,
    scanMode: result.mode,
    totalHostnames,
    hostnameSampleShownCount,
    findings: findings.map((f) => ({
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
}
