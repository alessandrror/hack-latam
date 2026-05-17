export type Severity = "critical" | "medium" | "low";

/** User-selected scan depth: quick skips subdomain CT enumeration and omits low-severity findings. */
export type ScanMode = "deep" | "quick";

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

export interface ScanResponseBody {
  target: string;
  normalizedTarget: string;
  inputKind: "domain" | "ip" | "unknown";
  mode: ScanMode;
  findings: ScanFinding[];
  modules: ScanModuleResult[];
}
