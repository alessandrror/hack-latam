import type { ScanFinding } from "@/types/scan";

export const MODULE_DISPLAY_ORDER = [
  "subdomain_enum",
  "dns_health",
  "dns_auth_details",
  "dns_caa_check",
  "tls_check",
  "tls_versions_check",
  "osint_passive",
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
  const f = findings.find((x) => x.module === "dns_caa_check");
  if (!f?.metadata || typeof f.metadata !== "object") return null;
  const present = (f.metadata as { caaPresent?: boolean }).caaPresent === true;
  return {
    id: "check-caa",
    label: "CAA (emisión de certificados)",
    status: present ? "pass" : "warn",
    detail: present
      ? "Se publicaron registros CAA"
      : "No hay registros CAA — refuerzo opcional",
  };
}

function tlsVersionsChecklistRow(findings: ScanFinding[]): ChecklistRow | null {
  const f = findings.find((x) => x.module === "tls_versions_check");
  if (!f) return null;

  const meta =
    f.metadata && typeof f.metadata === "object"
      ? (f.metadata as { legacyTlsEnabled?: boolean })
      : null;
  const legacy = meta?.legacyTlsEnabled === true;

  // When probes didn't negotiate successfully, the recon module omits
  // `supportedProtocols`/`legacyTlsEnabled` in metadata.
  if (
    f.severity === "medium" &&
    (!meta || typeof (f.metadata as { supportedProtocols?: unknown }).supportedProtocols === "undefined")
  ) {
    return {
      id: "check-tls-versions",
      label: "Versiones de protocolo TLS (deep)",
      status: "warn",
      detail: "No se pudieron completar las sondas — ver el hallazgo",
    };
  }
  if (legacy) {
    return {
      id: "check-tls-versions",
      label: "Versiones de protocolo TLS (deep)",
      status: "fail",
      detail: "Se aceptó TLS 1.0 o 1.1 en una sonda",
    };
  }
  return {
    id: "check-tls-versions",
    label: "Versiones de protocolo TLS (deep)",
    status: "pass",
    detail: "No se observó TLS 1.0/1.1 en sondas aisladas",
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
        label: "Certificado HTTPS",
        status: "fail",
        detail:
          days !== null && days < 0
            ? "Certificado expirado"
            : expiry.title,
      };
    }
    if (expiry.severity === "medium") {
      return {
        id: "check-cert",
        label: "Certificado HTTPS",
        status: "warn",
        detail:
          days !== null ? `${days} día(s) hasta la expiración` : expiry.title,
      };
    }
    return {
      id: "check-cert",
      label: "Certificado HTTPS",
      status: "pass",
      detail: days !== null ? `${days} día(s) restantes` : undefined,
    };
  }

  const noCert = tls.find((f) => f.id.includes("tls-check-no-cert"));
  if (noCert) {
    return {
      id: "check-cert",
      label: "Certificado HTTPS",
      status: "fail",
      detail: "No se pudo leer un certificado",
    };
  }

  return {
    id: "check-cert",
    label: "Certificado HTTPS",
    status: "warn",
    detail: "No se pudo resumir el certificado",
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
      label: "SPF (correo)",
      status: present ? "pass" : "fail",
      detail: present ? "Registro presente" : "No hay registro TXT SPF",
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
      detail: present ? summary ?? "Registro en _dmarc" : "No hay DMARC en _dmarc",
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
      label: "DKIM (selectores comunes)",
      status: detected ? "pass" : "warn",
      detail: detected
        ? "Se encontraron claves para selectores comunes"
        : "No se detectó en selectores muestreados",
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
    if (f.module === "dns_caa_check") return false;
    if (f.module === "tls_versions_check") return false;
    if (f.module === "tls_check") {
      if (f.id.includes("tls-check-expiry")) return false;
    }
    return true;
  });
}
