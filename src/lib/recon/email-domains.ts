import type { TargetInputKind } from "@/lib/recon/normalize-target";
import { classifyAndNormalizeTarget } from "@/lib/recon/normalize-target";
import { extractApexFromNormalizedHost } from "@/lib/recon/extract-apex";

/** Max raw email-like lines parsed from user input */
export const OSINT_EMAIL_MAX_LINES = 50;

/** Max distinct hostnames extracted from emails (beyond primary scan hostname) */
export const OSINT_EMAIL_MAX_UNIQUE_HOSTS = 10;

export type ParsedEmailDomainsResult = {
  /** Normalized hostnames from `@` RHS, lowercased, deduped, order preserved within cap */
  uniqueHosts: string[];
  /** Could not enqueue more domains after hitting OSINT_EMAIL_MAX_UNIQUE_HOSTS */
  truncatedDomainList: boolean;
  /** Non-empty tokens processed (capped line count) */
  parsedLineCount: number;
  /** Input had more than OSINT_EMAIL_MAX_LINES tokens */
  truncatedEmailList: boolean;
};

const EMAIL_SPLIT = /[\s,;|<>\u000A\u000D\u2028\u2029]+/g;

/**
 * Parses free-form pasted text into unique email domain hostnames (no mailbox part stored).
 */
export function parseEmailLinesForDomains(raw: string): ParsedEmailDomainsResult {
  const tokens = raw
    .trim()
    .split(EMAIL_SPLIT)
    .map((t) => t.trim())
    .filter(Boolean);

  const truncatedEmailList = tokens.length > OSINT_EMAIL_MAX_LINES;

  let parsedLineCount = 0;
  const uniqueHosts: string[] = [];
  let truncatedDomainList = false;

  const limit = Math.min(tokens.length, OSINT_EMAIL_MAX_LINES);

  for (let i = 0; i < limit; i++) {
    const token = tokens[i];
    parsedLineCount += 1;

    if (!token.includes("@")) continue;

    const atParts = splitEmailLocalAndDomain(token);
    if (!atParts) continue;

    const { domainSide } = atParts;

    const { kind, normalized } = classifyAndNormalizeTarget(domainSide);
    if (!normalized || kind === "unknown" || kind === "ip") {
      continue;
    }

    const host = normalized.trim().toLowerCase().replace(/^www\./, "");

    if (uniqueHosts.includes(host)) {
      continue;
    }

    if (uniqueHosts.length >= OSINT_EMAIL_MAX_UNIQUE_HOSTS) {
      truncatedDomainList = true;
      continue;
    }

    uniqueHosts.push(host);
  }

  return {
    uniqueHosts,
    truncatedDomainList,
    parsedLineCount,
    truncatedEmailList,
  };
}

/** Split mailbox into local @ domain using last `@` only. */
export function splitEmailLocalAndDomain(
  token: string,
): { local: string; domainSide: string } | null {
  const lower = token.toLowerCase().replace(/^[<]+|[>]+$/g, "");
  const idx = lower.lastIndexOf("@");
  if (idx <= 0 || idx === lower.length - 1) return null;

  const local = lower.slice(0, idx).trim();
  const domainSide = lower.slice(idx + 1).trim();
  if (!local || !domainSide) return null;

  return { local, domainSide };
}

export type ClassifiedEmailHostsResult = {
  /** Email-derived hostnames whose registrable apex matches `primaryApex` */
  eligible: string[];
  /** Distinct RHS domains that belong to another apex than primary */
  skippedExternal: string[];
};

/**
 * Keeps email domains only under the scan primary apex (`null` means no scans on email-derived hosts).
 */
export function classifyHostsByPrimaryApex(
  primaryApex: string | null,
  hosts: readonly string[],
): ClassifiedEmailHostsResult {
  if (!primaryApex) {
    return {
      eligible: [],
      skippedExternal: [...new Set(hosts)].sort((a, b) => a.localeCompare(b)),
    };
  }

  const apexLc = primaryApex.trim().toLowerCase();
  const eligible: string[] = [];
  const skippedSet = new Set<string>();

  for (const raw of hosts) {
    const h = raw.trim().toLowerCase().replace(/^www\./, "");
    if (!h) continue;

    const hostApex = extractApexFromNormalizedHost(h);
    if (!hostApex || hostApex !== apexLc) {
      skippedSet.add(h);
      continue;
    }

    if (!eligible.includes(h)) {
      eligible.push(h);
    }
  }

  return {
    eligible,
    skippedExternal: [...skippedSet].sort((a, b) => a.localeCompare(b)),
  };
}

/** Build hostname set for passive OSINT: primary domain target plus same-apex email hosts. */
export function buildPassiveOsintHostnames(params: {
  primaryNormalizedHost: string | null;
  inputKind: TargetInputKind;
  classifiedEligibleEmailHosts: string[];
}): string[] {
  const out = new Set<string>();

  if (params.inputKind === "domain" && params.primaryNormalizedHost) {
    out.add(
      params.primaryNormalizedHost.trim().toLowerCase().replace(/^www\./, ""),
    );
  }

  for (const h of params.classifiedEligibleEmailHosts) {
    out.add(h.trim().toLowerCase().replace(/^www\./, ""));
  }

  return [...out].sort((a, b) => a.localeCompare(b));
}

/**
 * Parses `emails` from JSON scan body — string (multiline), or string[] — into one raw blob.
 */
export function normalizeEmailsPayload(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.filter((x) => typeof x === "string").join("\n");
  }

  return "";
}
