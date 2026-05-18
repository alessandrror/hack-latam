import { promises as dns } from "node:dns";

import type { ScanFinding } from "@/types/scan";

const COMMON_DKIM_SELECTORS = [
  "default",
  "selector1",
  "selector2",
  "google",
  "k1",
  "mail",
  "smtp",
  "s1",
  "dkim",
  "mandrill",
];

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

function hasSpfRecord(txtLines: string[]): boolean {
  return txtLines.some((line) =>
    line.trim().toLowerCase().startsWith("v=spf1"),
  );
}

function summarizeDmarcPolicy(txtLines: string[]): string | null {
  const dmarcLine = txtLines.find((line) =>
    line.trim().toLowerCase().startsWith("v=dmarc1"),
  );
  if (!dmarcLine) return null;
  const lower = dmarcLine.toLowerCase();
  const pMatch = lower.match(/\bp=(none|quarantine|reject)\b/);
  const pctMatch = lower.match(/\bpct=(\d+)/);
  const parts: string[] = [];
  if (pMatch) parts.push(`policy p=${pMatch[1]}`);
  if (pctMatch) parts.push(`applies to up to ${pctMatch[1]}% of mail (pct)`);
  return parts.length ? parts.join("; ") : "DMARC record present";
}

function hasDkimRecord(txtLines: string[]): boolean {
  return txtLines.some((line) =>
    line.trim().toUpperCase().startsWith("V=DKIM1"),
  );
}

/**
 * Passive DNS checks for SPF, DMARC, and common DKIM selector TXT records.
 */
export async function collectDnsHealthFindings(
  domain: string,
): Promise<ScanFinding[]> {
  const trimmed = domain.trim().toLowerCase();
  const findings: ScanFinding[] = [];

  const rootTxt = await resolveTxtSafe(trimmed);
  const spfPresent = hasSpfRecord(rootTxt);

  findings.push({
    id: `dns-health-spf-${trimmed}`,
    module: "dns_health",
    severity: spfPresent ? "low" : "medium",
    title: spfPresent
      ? "Se encontró un registro SPF para la autenticación de correo"
      : "No se encontró un registro SPF para este dominio",
    explanation: spfPresent
      ? "SPF le indica a los servidores receptores qué servidores pueden enviar correo para tu dominio; tenerlo reduce el riesgo de suplantación."
      : "Sin SPF, es más fácil que un atacante falsifique correos que parezcan enviados desde tu dominio; añadir un registro TXT de SPF es una salvaguarda básica.",
    metadata: {
      check: "spf",
      present: spfPresent,
    },
  });

  const dmarcName = `_dmarc.${trimmed}`;
  const dmarcTxt = await resolveTxtSafe(dmarcName);
  const dmarcPresent =
    dmarcTxt.some((line) => line.trim().toLowerCase().startsWith("v=dmarc1")) ||
    false;
  const dmarcSummary = dmarcPresent ? summarizeDmarcPolicy(dmarcTxt) : null;

  findings.push({
    id: `dns-health-dmarc-${trimmed}`,
    module: "dns_health",
    severity: dmarcPresent ? "low" : "medium",
    title: dmarcPresent
      ? "Se publicó una política DMARC"
      : "No se encontró un registro DMARC",
    explanation: dmarcPresent
      ? `DMARC se apoya en SPF/DKIM y le indica a los receptores cómo tratar el correo sospechoso (${dmarcSummary ?? "ver DNS"}).`
      : "DMARC ayuda a prevenir el phishing usando tu nombre de dominio; publicar un registro DMARC en _dmarc está fuertemente recomendado.",
    metadata: {
      check: "dmarc",
      present: dmarcPresent,
      host: dmarcName,
      ...(dmarcSummary ? { summary: dmarcSummary } : {}),
    },
  });

  let dkimFound = false;
  const dkimSelectorsHit: string[] = [];

  for (const selector of COMMON_DKIM_SELECTORS) {
    const name = `${selector}._domainkey.${trimmed}`;
    const txt = await resolveTxtSafe(name);
    if (hasDkimRecord(txt)) {
      dkimFound = true;
      dkimSelectorsHit.push(selector);
    }
  }

  findings.push({
    id: `dns-health-dkim-${trimmed}`,
    module: "dns_health",
    severity: "low",
    title: dkimFound
      ? "La firma DKIM parece estar configurada (selectores comunes)"
      : "No se detectó DKIM mediante selectores comunes",
    explanation: dkimFound
      ? `El DNS público muestra claves DKIM en el/los selector(es): ${dkimSelectorsHit.slice(0, 5).join(", ")}${
          dkimSelectorsHit.length > 5 ? ", …" : ""
        } — el correo firmado ayuda a demostrar que los mensajes son auténticos.`
      : "No encontramos registros TXT de DKIM bajo una lista corta de selectores comunes; tu proveedor podría usar otros selectores, así que la ausencia aquí no es concluyente.",
    metadata: {
      check: "dkim",
      selectorsChecked: COMMON_DKIM_SELECTORS,
      selectorsMatched: dkimSelectorsHit,
      detected: dkimFound,
    },
  });

  return findings;
}
