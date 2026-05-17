import type { ScanModuleContext } from "@/lib/recon/scan-context";
import { collectDnsAuthDetailsFindings } from "@/lib/recon/dns-auth-details";
import { collectDnsCaaFindings } from "@/lib/recon/dns-caa-check";
import { collectDnsHealthFindings } from "@/lib/recon/dns-health";
import { collectPassiveOsintFindings } from "@/lib/recon/osint-passive";
import { enumerateSubdomainsFromCrtSh } from "@/lib/recon/subdomains";
import { collectTlsFindings } from "@/lib/recon/tls-check";
import { collectTlsVersionFindings } from "@/lib/recon/tls-versions-check";
import type { ScanFinding, ScanModuleResult } from "@/types/scan";

export interface ScanPipelineResult {
  modules: ScanModuleResult[];
  findings: ScanFinding[];
}

interface RegisteredModule {
  name: string;
  skipReason: (ctx: ScanModuleContext) => string | null;
  run: (ctx: ScanModuleContext) => Promise<ScanFinding[]>;
}

function emailOsintMetaUseful(
  meta: ScanModuleContext["emailOsintMeta"],
): boolean {
  if (!meta) return false;
  return (
    meta.skippedExternalDomains.length > 0 ||
    meta.truncatedEmailList ||
    meta.truncatedUniqueDomainList
  );
}

const MODULES: RegisteredModule[] = [
  {
    name: "subdomain_enum",
    skipReason: (ctx) =>
      ctx.inputKind === "ip"
        ? "Subdomain discovery via certificate transparency needs a domain name, not a raw IP address."
        : ctx.mode === "quick"
          ? "Quick scan skips certificate transparency subdomain enumeration for faster results."
          : null,
    run: async (ctx) => enumerateSubdomainsFromCrtSh(ctx.normalizedTarget),
  },
  {
    name: "dns_health",
    skipReason: (ctx) =>
      ctx.inputKind === "ip"
        ? "DNS email-auth checks (SPF, DMARC, DKIM) apply to domain names, not a raw IP address."
        : null,
    run: async (ctx) => collectDnsHealthFindings(ctx.normalizedTarget),
  },
  {
    name: "tls_check",
    skipReason: (ctx) =>
      ctx.inputKind === "ip"
        ? "TLS certificate inspection uses the hostname from HTTPS; enter a domain name for this check."
        : null,
    run: async (ctx) => collectTlsFindings(ctx.normalizedTarget),
  },
  {
    name: "tls_versions_check",
    skipReason: (ctx) =>
      ctx.inputKind === "ip"
        ? "TLS version probing requires a domain hostname with HTTPS, not a raw IP address."
        : ctx.mode === "quick"
          ? "Quick scan skips multi-handshake TLS version probes."
          : null,
    run: async (ctx) => collectTlsVersionFindings(ctx.normalizedTarget),
  },
  {
    name: "dns_auth_details",
    skipReason: (ctx) =>
      ctx.inputKind === "ip"
        ? "SPF/DMARC policy parsing needs a domain name, not a raw IP address."
        : ctx.mode === "quick"
          ? "Quick scan skips SPF/DMARC policy detail checks."
          : null,
    run: async (ctx) => collectDnsAuthDetailsFindings(ctx.normalizedTarget),
  },
  {
    name: "dns_caa_check",
    skipReason: (ctx) =>
      ctx.inputKind === "ip"
        ? "CAA records are published on domain names, not raw IP addresses."
        : ctx.mode === "quick"
          ? "Quick scan skips CAA lookups."
          : null,
    run: async (ctx) => collectDnsCaaFindings(ctx.normalizedTarget),
  },
  {
    name: "osint_passive",
    skipReason: (ctx) => {
      const n = ctx.osintHostnames?.length ?? 0;
      const metaOk = emailOsintMetaUseful(ctx.emailOsintMeta);
      if (n === 0 && !metaOk) {
        return "Passive OSINT needs a domain target or pasted emails tied to the same apex.";
      }
      return null;
    },
    run: async (ctx) => collectPassiveOsintFindings(ctx),
  },
];

async function executeModule(
  mod: RegisteredModule,
  ctx: ScanModuleContext,
): Promise<{ moduleResult: ScanModuleResult; findings: ScanFinding[] }> {
  const skip = mod.skipReason(ctx);
  if (skip !== null) {
    return {
      moduleResult: {
        name: mod.name,
        status: "skipped",
        errorMessage: skip,
      },
      findings: [],
    };
  }

  const started = Date.now();
  try {
    const findings = await mod.run(ctx);
    return {
      moduleResult: {
        name: mod.name,
        status: "ok",
        durationMs: Date.now() - started,
      },
      findings,
    };
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : `${mod.name} failed.`;
    return {
      moduleResult: {
        name: mod.name,
        status: "error",
        durationMs: Date.now() - started,
        errorMessage: message,
      },
      findings: [],
    };
  }
}

/**
 * Runs all registered recon modules in parallel; failures are isolated per module.
 */
export async function runScanModules(
  ctx: ScanModuleContext,
): Promise<ScanPipelineResult> {
  const settled = await Promise.all(
    MODULES.map((mod) => executeModule(mod, ctx)),
  );

  const modules: ScanModuleResult[] = [];
  const allFindings: ScanFinding[] = [];

  for (const row of settled) {
    modules.push(row.moduleResult);
    allFindings.push(...row.findings);
  }

  const findings =
    ctx.mode === "quick"
      ? allFindings.filter(
          (f) => f.severity !== "low" || f.module === "osint_passive",
        )
      : allFindings;

  return { modules, findings };
}
