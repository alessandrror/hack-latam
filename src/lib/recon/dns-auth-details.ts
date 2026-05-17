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
      title = "SPF ends with +all (overly permissive)";
      explanation =
        "An SPF record that ends with +all effectively allows anyone to pass SPF for your domain — this is a serious email-spoofing misconfiguration. Replace with explicit sending sources and a restrictive \"all\" mechanism.";
    } else if (tail === "strict") {
      severity = "low";
      title = "SPF uses a strict fail (-all) default";
      explanation =
        "The SPF record ends with -all, meaning senders not in your SPF should be rejected — a strong posture when your authorized senders are complete.";
    } else if (tail === "soft") {
      severity = "low";
      title = "SPF uses softfail (~all)";
      explanation =
        "SPF ends with ~all (soft fail) — receiving servers may still deliver suspicious mail. Consider tightening to -all once all legitimate senders are listed.";
    } else if (tail === "neutral") {
      severity = "low";
      title = "SPF uses neutral (?all)";
      explanation =
        "?all is neutral — it neither passes nor fails unknown senders strongly. Review whether you can use ~all or -all with a complete sender list.";
    } else {
      severity = "low";
      title = "SPF record present — default policy unclear";
      explanation =
        "We could not detect a clear terminal all mechanism (-all, ~all, ?all, +all). Verify the SPF string ends with the policy you intend.";
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
      title = "DMARC policy is p=none (monitoring only)";
      explanation =
        "DMARC is published but policy is none — suspicious mail may still be delivered. Move toward quarantine or reject once you are confident legitimate mail passes SPF/DKIM.";
    } else if (p === "quarantine") {
      severity = "low";
      title = "DMARC policy uses quarantine";
      explanation =
        "Suspicious mail can be marked as spam — stronger than none. Consider reject for high-risk brands when ready.";
    } else if (p === "reject") {
      severity = "low";
      title = "DMARC policy uses reject";
      explanation =
        "Strong DMARC — failing messages can be blocked. Keep monitoring aggregate reports for false positives.";
    } else {
      severity = "low";
      title = "DMARC record present — policy could not be parsed";
      explanation =
        "A DMARC TXT record exists; confirm p=none|quarantine|reject is set as intended.";
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
