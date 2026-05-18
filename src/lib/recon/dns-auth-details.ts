import { promises as dns } from "node:dns";

import type { ScanFinding } from "@/types/scan";

function flattenTxtChunks(records: string[][]): string[] {
  return records.map((chunks) => chunks.join(""));
}

async function resolveTxtSafe(name: string): Promise<string[]> {
  try {
    const rows = await dns.resolveTxt(name);
    return flattenTxtChunks(rows);
  } catch {
    return [];
  }
}

function spfLine(txtLines: string[]): string | null {
  const line = txtLines.find((l) => l.trim().toLowerCase().startsWith("v=spf1"));
  return line ? line.trim() : null;
}

type SpfTail = "strict" | "soft" | "neutral" | "passall" | "unknown";

function classifySpfAllMechanism(spf: string): SpfTail {
  const lower = spf.toLowerCase();
  if (/\s\+all(\s|$)/.test(lower)) return "passall";
  if (/\s-all(\s|$)/.test(lower)) return "strict";
  if (/\s~all(\s|$)/.test(lower)) return "soft";
  if (/\s\?all(\s|$)/.test(lower)) return "neutral";
  return "unknown";
}

function dmarcLine(txtLines: string[]): string | null {
  const line = txtLines.find((l) =>
    l.trim().toLowerCase().startsWith("v=dmarc1"),
  );
  return line ? line.trim() : null;
}

function parseDmarcPolicy(raw: string): {
  p: "none" | "quarantine" | "reject" | "unknown";
  pct?: number;
} {
  const lower = raw.toLowerCase();
  const pMatch = lower.match(/\bp=(none|quarantine|reject)\b/);
  const p =
    pMatch && pMatch[1] === "none"
      ? "none"
      : pMatch && pMatch[1] === "quarantine"
        ? "quarantine"
        : pMatch && pMatch[1] === "reject"
          ? "reject"
          : "unknown";
  const pctMatch = lower.match(/\bpct=(\d{1,3})\b/);
  let pct: number | undefined;
  if (pctMatch) {
    const n = Number.parseInt(pctMatch[1], 10);
    if (Number.isFinite(n)) pct = Math.min(100, Math.max(0, n));
  }
  return { p, ...(pct !== undefined ? { pct } : {}) };
}

/**
 * Deep-only: SPF/DMARC strictness beyond presence checks in `dns_health`.
 */
export async function collectDnsAuthDetailsFindings(
  domain: string,
): Promise<ScanFinding[]> {
  const trimmed = domain.trim().toLowerCase();
  const findings: ScanFinding[] = [];

  const rootTxt = await resolveTxtSafe(trimmed);
  const spfRaw = spfLine(rootTxt);
  if (spfRaw) {
    const tail = classifySpfAllMechanism(spfRaw);
    let severity: "medium" | "low";
    let title: string;
    let explanation: string;

    if (tail === "passall") {
      severity = "medium";
      title = "SPF termina con +all (demasiado permisivo)";
      explanation =
        "Un SPF que termina con +all permite, en la práctica, que cualquiera pueda pasar SPF para tu dominio; esto es una configuración grave que facilita la suplantación de correo. Sustituye el mecanismo por fuentes de envío explícitas y un \"all\" restrictivo.";
    } else if (tail === "strict") {
      severity = "low";
      title = "SPF usa -all como política estricta";
      explanation =
        "El SPF termina con -all, lo que significa que los remitentes no incluidos en tu SPF deberían ser rechazados; es una postura sólida cuando tu lista de emisores autorizados está completa.";
    } else if (tail === "soft") {
      severity = "low";
      title = "SPF usa softfail (~all)";
      explanation =
        "El SPF termina con ~all (soft fail); los servidores receptores podrían seguir entregando correo sospechoso. Ajusta a -all cuando hayas listado todos los emisores legítimos.";
    } else if (tail === "neutral") {
      severity = "low";
      title = "SPF usa neutral (?all)";
      explanation =
        "?all es neutral: no aprueba ni desaprueba con firmeza a los remitentes desconocidos. Revisa si puedes usar ~all o -all con una lista completa de emisores.";
    } else {
      severity = "low";
      title = "Se detectó un SPF, pero la política final no está clara";
      explanation =
        "No pudimos detectar un mecanismo \"all\" final claro (-all, ~all, ?all, +all). Verifica que el string SPF termina con la política que deseas aplicar.";
    }

    findings.push({
      id: `dns-auth-details-spf-${trimmed}`,
      module: "dns_auth_details",
      severity,
      title,
      explanation,
      metadata: {
        check: "spf_policy",
        spfTail: tail,
        summary: spfRaw.length > 220 ? `${spfRaw.slice(0, 220)}…` : spfRaw,
      },
    });
  }

  const dmarcName = `_dmarc.${trimmed}`;
  const dmarcTxt = await resolveTxtSafe(dmarcName);
  const dmarcRaw = dmarcLine(dmarcTxt);
  if (dmarcRaw) {
    const { p, pct } = parseDmarcPolicy(dmarcRaw);
    let severity: "medium" | "low";
    let title: string;
    let explanation: string;

    if (p === "none") {
      severity = "medium";
      title = "La política DMARC es p=none (solo monitorización)";
      explanation =
        "DMARC está publicado, pero la política es none; el correo sospechoso aún podría entregarse. Avanza hacia quarantine o reject cuando estés seguro de que el correo legítimo pasa SPF/DKIM.";
    } else if (p === "quarantine") {
      severity = "low";
      title = "La política DMARC usa quarantine";
      explanation =
        "El correo sospechoso puede marcarse como spam, algo más fuerte que none. Considera reject para marcas de alto riesgo cuando estés listo.";
    } else if (p === "reject") {
      severity = "low";
      title = "La política DMARC usa reject";
      explanation =
        "DMARC fuerte: los mensajes que fallen podrían bloquearse. Sigue monitoreando los reportes agregados para evitar falsos positivos.";
    } else {
      severity = "low";
      title = "Se encontró un registro DMARC, pero no se pudo interpretar la política";
      explanation =
        "Existe un registro TXT DMARC; confirma que p=none|quarantine|reject esté configurado como corresponde.";
    }

    findings.push({
      id: `dns-auth-details-dmarc-${trimmed}`,
      module: "dns_auth_details",
      severity,
      title,
      explanation,
      metadata: {
        check: "dmarc_policy",
        host: dmarcName,
        dmarcP: p,
        ...(pct !== undefined ? { dmarcPct: pct } : {}),
        summary:
          dmarcRaw.length > 220 ? `${dmarcRaw.slice(0, 220)}…` : dmarcRaw,
      },
    });
  }

  return findings;
}
