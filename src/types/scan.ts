export type Severity = "critical" | "medium" | "low";

export type ScanModuleStatus = "ok" | "error" | "skipped";

export interface ScanFinding {
  id: string;
  module: string;
  severity: Severity;
  title: string;
  /** Plain-language risk line for SMB-facing dashboard */
  explanation: string;
  /** Optional details for the UI (e.g. host lists) */
  metadata?: Record<string, unknown>;
}

export interface ScanModuleResult {
  name: string;
  status: ScanModuleStatus;
  durationMs?: number;
  errorMessage?: string;
}

/** Client-requested scan depth; echoed by the scan API once auth is enforced. */
export type ScanDepthMode = "quick" | "deep";

export interface ScanResponseBody {
  target: string;
  normalizedTarget: string;
  inputKind: "domain" | "ip" | "unknown";
  findings: ScanFinding[];
  modules: ScanModuleResult[];
  scanMode: ScanDepthMode;
}
