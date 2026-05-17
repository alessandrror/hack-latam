
const OWNERSHIP_VERIFICATION_BYPASS_APEXES = [
  "cloudflare.com",
  "context7.com",
  "faces.app",
  "google.com",
  "make.com",
  "monologue.to",
  "openrouter.ai",
  "zavu.dev",
] as const satisfies readonly string[];

const BYPASS_SET = new Set<string>(
  OWNERSHIP_VERIFICATION_BYPASS_APEXES.map((d) => d.toLowerCase()),
);

export const OWNERSHIP_VERIFICATION_BYPASS_DOMAIN_APEXES: readonly string[] =
  OWNERSHIP_VERIFICATION_BYPASS_APEXES;

export function apexBypassesOwnershipVerification(apex: string): boolean {
  return BYPASS_SET.has(apex.trim().toLowerCase());
}
