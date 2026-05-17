import type { ScanFinding } from "@/types/scan";

export const MODULE_DISPLAY_ORDER = [
  "subdomain_enum",
  "dns_health",
  "dns_auth_details",
  "dns_caa",
  "tls_check",
  "tls_versions",
] as const;

export function sortedFindings(findings: ScanFinding[]): ScanFinding[] {
  const rank = (m: string) => {
    const i = MODULE_DISPLAY_ORDER.indexOf(
      m as (typeof MODULE_DISPLAY_ORDER)[number],
    );
    return i === -1 ? MODULE_DISPLAY_ORDER.length : i;
  };
  return [...findings].sort((a, b) => {
    const byModule = rank(a.module) - rank(b.module);
    if (byModule !== 0) return byModule;
    return a.id.localeCompare(b.id);
  });
}

export function aggregateHostnamesFromFindings(
  findings: ScanFinding[],
): { hostnames: string[]; total: number } {
  const seen = new Set<string>();
  let maxTotal = 0;

  for (const f of findings) {
    const meta = f.metadata;
    if (!meta || typeof meta !== "object") continue;
    const hostnames =
      Array.isArray((meta as { hostnames?: unknown }).hostnames) &&
      (meta as { hostnames: unknown[] }).hostnames.every(
        (h) => typeof h === "string",
      )
        ? ((meta as { hostnames: string[] }).hostnames as string[])
        : [];
    const total = (meta as { totalHostnames?: unknown }).totalHostnames;
    if (typeof total === "number" && total > maxTotal) maxTotal = total;

    for (const h of hostnames) {
      seen.add(h);
    }
  }

  const list = [...seen].sort((a, b) => a.localeCompare(b));
  const total = maxTotal > list.length ? maxTotal : list.length;
  return { hostnames: list, total };
}

export type ChecklistStatus = "pass" | "warn" | "fail";

export interface ChecklistRow {
  id: string;
  label: string;
  status: ChecklistStatus;
  detail?: string;
}

function caaChecklistRow(findings: ScanFinding[]): ChecklistRow | null {
  const f = findings.find((x) => x.module === "dns_caa");
  if (!f?.metadata || typeof f.metadata !== "object") return null;
  const present = (f.metadata as { caaPresent?: boolean }).caaPresent === true;
  return {
    id: "check-caa",
    label: "CAA (certificate issuance)",
    status: present ? "pass" : "warn",
    detail: present
      ? "CAA record(s) published"
      : "No CAA records — optional hardening control",
  };
}

function tlsVersionsChecklistRow(findings: ScanFinding[]): ChecklistRow | null {
  const f = findings.find((x) => x.module === "tls_versions");
  if (!f) return null;

  const meta =
    f.metadata && typeof f.metadata === "object"
      ? (f.metadata as { legacyTlsEnabled?: boolean })
      : null;
  const legacy = meta?.legacyTlsEnabled === true;

  if (f.severity === "medium" && f.title.includes("did not complete")) {
    return {
      id: "check-tls-versions",
      label: "TLS protocol versions (deep)",
      status: "warn",
      detail: "Probes could not finish — see finding",
    };
  }
  if (legacy) {
    return {
      id: "check-tls-versions",
      label: "TLS protocol versions (deep)",
      status: "fail",
      detail: "TLS 1.0 or 1.1 accepted on a probe",
    };
  }
  return {
    id: "check-tls-versions",
    label: "TLS protocol versions (deep)",
    status: "pass",
    detail: "No TLS 1.0/1.1 observed on isolated probes",
  };
}

function tlsCertChecklist(findings: ScanFinding[]): ChecklistRow | null {
  const tls = findings.filter((f) => f.module === "tls_check");
  if (tls.length === 0) return null;

  const expiry = tls.find((f) => f.id.includes("tls-check-expiry"));
  if (expiry) {
    const meta = expiry.metadata;
    const days =
      meta && typeof meta === "object" && typeof meta.daysRemaining === "number"
        ? meta.daysRemaining
        : null;
    if (expiry.severity === "critical") {
      return {
        id: "check-cert",
        label: "HTTPS certificate",
        status: "fail",
        detail:
          days !== null && days < 0
            ? "Certificate expired"
            : expiry.title,
      };
    }
    if (expiry.severity === "medium") {
      return {
        id: "check-cert",
        label: "HTTPS certificate",
        status: "warn",
        detail: days !== null ? `${days} day(s) until expiry` : expiry.title,
      };
    }
    return {
      id: "check-cert",
      label: "HTTPS certificate",
      status: "pass",
      detail: days !== null ? `${days} day(s) remaining` : undefined,
    };
  }

  const noCert = tls.find((f) => f.id.includes("tls-check-no-cert"));
  if (noCert) {
    return {
      id: "check-cert",
      label: "HTTPS certificate",
      status: "fail",
      detail: "No certificate read",
    };
  }

  return {
    id: "check-cert",
    label: "HTTPS certificate",
    status: "warn",
    detail: "Could not summarize certificate",
  };
}

/**
 * Structured checklist rows for DNS + TLS, derived from findings.
 */
export function buildChecklistRows(findings: ScanFinding[]): ChecklistRow[] {
  const rows: ChecklistRow[] = [];

  const spf = findings.find(
    (f) =>
      f.module === "dns_health" &&
      (f.metadata as { check?: string } | undefined)?.check === "spf",
  );
  if (spf?.metadata && typeof spf.metadata === "object") {
    const present = (spf.metadata as { present?: boolean }).present === true;
    rows.push({
      id: "check-spf",
      label: "SPF (email)",
      status: present ? "pass" : "fail",
      detail: present ? "Record present" : "No SPF TXT record",
    });
  }

  const dmarc = findings.find(
    (f) =>
      f.module === "dns_health" &&
      (f.metadata as { check?: string } | undefined)?.check === "dmarc",
  );
  if (dmarc?.metadata && typeof dmarc.metadata === "object") {
    const present =
      (dmarc.metadata as { present?: boolean }).present === true;
    const summary =
      typeof (dmarc.metadata as { summary?: unknown }).summary === "string"
        ? ((dmarc.metadata as { summary: string }).summary as string)
        : undefined;
    rows.push({
      id: "check-dmarc",
      label: "DMARC",
      status: present ? "pass" : "fail",
      detail: present ? summary ?? "_dmarc record" : "No DMARC at _dmarc",
    });
  }

  const dkim = findings.find(
    (f) =>
      f.module === "dns_health" &&
      (f.metadata as { check?: string } | undefined)?.check === "dkim",
  );
  if (dkim?.metadata && typeof dkim.metadata === "object") {
    const detected =
      (dkim.metadata as { detected?: boolean }).detected === true;
    rows.push({
      id: "check-dkim",
      label: "DKIM (common selectors)",
      status: detected ? "pass" : "warn",
      detail: detected
        ? "Keys found for common selector names"
        : "Not detected on sampled selectors",
    });
  }

  const caa = caaChecklistRow(findings);
  if (caa) rows.push(caa);

  const cert = tlsCertChecklist(findings);
  if (cert) rows.push(cert);

  const tlsVersions = tlsVersionsChecklistRow(findings);
  if (tlsVersions) rows.push(tlsVersions);

  return rows;
}

/** Critical + medium findings for the risk column. */
export function riskFindings(findings: ScanFinding[]): ScanFinding[] {
  return sortedFindings(findings).filter(
    (f) => f.severity === "critical" || f.severity === "medium",
  );
}

/** Low-severity findings; optional filter skips items already surfaced in checklist rows. */
export function informationalFindings(
  findings: ScanFinding[],
  options?: { excludeModuleChecks?: boolean },
): ScanFinding[] {
  const sorted = sortedFindings(findings).filter((f) => f.severity === "low");
  if (!options?.excludeModuleChecks) return sorted;

  return sorted.filter((f) => {
    if (f.module === "dns_health") return false;
    if (f.module === "dns_caa") return false;
    if (f.module === "tls_versions") return false;
    if (f.module === "tls_check") {
      if (f.id.includes("tls-check-expiry")) return false;
    }
    return true;
  });
}
