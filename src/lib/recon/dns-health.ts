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
      ? "SPF record found for email authentication"
      : "No SPF record found for this domain",
    explanation: spfPresent
      ? "SPF tells receiving mail servers which servers may send mail for your domain — having one reduces spoofing risk."
      : "Without SPF, it is easier for attackers to forge emails that look like they came from your domain — adding an SPF TXT record is a basic safeguard.",
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
      ? "DMARC policy published"
      : "No DMARC record found",
    explanation: dmarcPresent
      ? `DMARC builds on SPF/DKIM and tells receivers how to handle suspicious mail (${dmarcSummary ?? "see DNS"}).`
      : "DMARC helps prevent phishing using your domain name — publishing a DMARC record at _dmarc is strongly recommended.",
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
      ? "DKIM signing appears configured (common selectors)"
      : "DKIM not detected via common selectors",
    explanation: dkimFound
      ? `Public DNS shows DKIM keys under selector(s): ${dkimSelectorsHit.slice(0, 5).join(", ")}${dkimSelectorsHit.length > 5 ? ", …" : ""} — signed mail helps prove messages are authentic.`
      : "We did not find DKIM TXT records under a short list of common selectors — your provider may use a different selector, so absence here is not definitive.",
    metadata: {
      check: "dkim",
      selectorsChecked: COMMON_DKIM_SELECTORS,
      selectorsMatched: dkimSelectorsHit,
      detected: dkimFound,
    },
  });

  return findings;
}
