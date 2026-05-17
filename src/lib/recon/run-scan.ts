import type { ScanModuleContext } from "@/lib/recon/scan-context";
import { collectDnsHealthFindings } from "@/lib/recon/dns-health";
import { enumerateSubdomainsFromCrtSh } from "@/lib/recon/subdomains";
import { collectTlsFindings } from "@/lib/recon/tls-check";
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

const MODULES: RegisteredModule[] = [
  {
    name: "subdomain_enum",
    skipReason: (ctx) =>
      ctx.inputKind === "ip"
        ? "Subdomain discovery via certificate transparency needs a domain name, not a raw IP address."
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
  const findings: ScanFinding[] = [];

  for (const row of settled) {
    modules.push(row.moduleResult);
    findings.push(...row.findings);
  }

  return { modules, findings };
}
