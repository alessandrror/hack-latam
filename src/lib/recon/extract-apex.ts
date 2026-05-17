import { getDomain } from "tldts";

const DOMAINISH =
  /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;

/**
 * Registrable apex / eTLD+1 for a normalized hostname (no scheme, lowercase).
 * Returns null for IPs, invalid hosts, or empty input.
 */
export function extractApexFromNormalizedHost(host: string): string | null {
  const h = host.trim().toLowerCase();
  if (!h || !DOMAINISH.test(h)) {
    return null;
  }
  const apex = getDomain(h, { detectIp: false, mixedInputs: false });
  if (apex) {
    return apex.toLowerCase();
  }
  const parts = h.split(".").filter(Boolean);
  if (parts.length >= 2) {
    return parts.slice(-2).join(".");
  }
  return null;
}

export function isLikelyDomainHostname(host: string): boolean {
  return extractApexFromNormalizedHost(host) !== null;
}
