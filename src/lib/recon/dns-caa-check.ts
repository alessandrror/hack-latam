import { promises as dns } from "node:dns";

import type { ScanFinding } from "@/types/scan";

type CaaRecords = Awaited<ReturnType<typeof dns.resolveCaa>>;

function formatCaaRecords(
  records: CaaRecords,
): { issue?: string[]; issuewild?: string[] } {
  const issue: string[] = [];
  const issuewild: string[] = [];
  for (const r of records) {
    if (typeof r.issue === "string" && r.issue) issue.push(r.issue);
    if (typeof r.issuewild === "string" && r.issuewild)
      issuewild.push(r.issuewild);
  }
  const out: { issue?: string[]; issuewild?: string[] } = {};
  if (issue.length) out.issue = [...new Set(issue)];
  if (issuewild.length) out.issuewild = [...new Set(issuewild)];
  return out;
}

/**
 * Deep-only: CAA records control which CAs may issue certificates for the domain.
 */
export async function collectDnsCaaFindings(domain: string): Promise<ScanFinding[]> {
  const trimmed = domain.trim().toLowerCase();
  if (!trimmed) return [];

  let records: CaaRecords = [];
  try {
    records = await dns.resolveCaa(trimmed);
  } catch {
    records = [];
  }

  const caaPresent = records.length > 0;
  const formatted = caaPresent ? formatCaaRecords(records) : {};
  const hasRules = Boolean(formatted.issue?.length || formatted.issuewild?.length);

  const severity = "low" as const;
  const title = caaPresent
    ? "CAA records published for certificate issuance control"
    : "No CAA records found";

  const explanation = caaPresent
    ? hasRules
      ? "CAA tells public CAs which authorities may issue certificates for your domain — reduces risk of mis-issued certs if DNS is protected."
      : "CAA-style records were returned but tagged fields were empty in the resolver view — verify with your DNS admin that intended issue/issuewild values are set."
    : "Without CAA, any CA that can validate control may issue for this name (subject to normal CA rules). Adding CAA is optional hardening for many SMBs.";

  const finding: ScanFinding = {
    id: `dns-caa-${trimmed}`,
    module: "dns_caa",
    severity,
    title,
    explanation,
    metadata: {
      hostname: trimmed,
      caaPresent,
      ...(Object.keys(formatted).length > 0 ? formatted : {}),
      recordCount: records.length,
    },
  };

  return [finding];
}
