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

/** Present when the client submitted an `emails` field (audit + UI). No mailbox parts. */
export interface EmailDomainSummary {
  primaryApex: string | null;
  /** Same-apex hostnames derived from pasted emails (normalized, no `www.` prefix) */
  eligibleEmailDomains: string[];
  /** Domains from emails that did not match `primaryApex` */
  skippedExternalDomains: string[];
  /** Lines/tokens processed from input (capped) */
  parsedEmailLineCount: number;
  truncatedEmailList: boolean;
  truncatedUniqueDomainList: boolean;
}

export interface ScanResponseBody {
  target: string;
  normalizedTarget: string;
  inputKind: "domain" | "ip" | "unknown";
  mode: ScanMode;
  findings: ScanFinding[];
  modules: ScanModuleResult[];
  /** Set when the request included a non-empty `emails` payload */
  emailDomainSummary?: EmailDomainSummary;
}
