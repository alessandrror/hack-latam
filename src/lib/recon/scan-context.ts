import type { TargetInputKind } from "@/lib/recon/normalize-target";
import type { ScanMode } from "@/types/scan";

/** Shared context passed to each recon module runner. */
export interface ScanModuleContext {
  normalizedTarget: string;
  inputKind: TargetInputKind;
  mode: ScanMode;
}
