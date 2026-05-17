import type { TargetInputKind } from "@/lib/recon/normalize-target";
import type { ScanMode } from "@/types/scan";

/** Shared context passed to each recon module runner. */
export interface ScanModuleContext {
  normalizedTarget: string;
  inputKind: TargetInputKind;
  mode: ScanMode;
  /** Registrable apex of the primary scan hostname when `inputKind === "domain"` */
  primaryApex?: string | null;
  /** Hostnames to run passive OSINT against (primary + same-apex email domains) */
  osintHostnames?: string[];
  /** Context from optional email list (for summary findings only) */
  emailOsintMeta?: {
    skippedExternalDomains: string[];
    truncatedEmailList: boolean;
    truncatedUniqueDomainList: boolean;
  };
}
