"use client";

import { SignInButton } from "@clerk/nextjs";
import { Zap } from "lucide-react";
import type { FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { TargetInputKind } from "@/lib/recon/normalize-target";

import {
  OwnershipVerificationSection,
  type VerificationSnapshot,
} from "./OwnershipVerificationSection";

export type ScanMode = "deep" | "quick";

type ScanFormPanelProps = {
  target: string;
  onTargetChange: (value: string) => void;
  scanMode: ScanMode;
  onScanModeChange: (mode: ScanMode) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  error: string | null;
  authLoaded: boolean;
  isAuthenticated: boolean;
  targetKind: TargetInputKind;
  /** Registrable apex when `targetKind === "domain"` */
  apexDomain: string | null;
  /** `undefined` while Convex `getStatus` is loading */
  verification: VerificationSnapshot | undefined;
  onOwnershipVerified: () => void;
};

const MODE_OPTIONS: {
  id: ScanMode;
  label: string;
  desc: string;
}[] = [
  {
    id: "deep",
    label: "Profundo",
    desc: "Seis módulos + checklist. Cuenta y verificación DNS o HTTPS del apex.",
  },
  {
    id: "quick",
    label: "Rápido",
    desc: "Cobertura reducida; sin hallazgos de severidad baja.",
  },
];

export function ScanFormPanel({
  target,
  onTargetChange,
  scanMode,
  onScanModeChange,
  onSubmit,
  loading,
  error,
  authLoaded,
  isAuthenticated,
  targetKind,
  apexDomain,
  verification,
  onOwnershipVerified,
}: ScanFormPanelProps) {
  const charCount = target.length;
  const deepRequiresAuth =
    scanMode === "deep" && authLoaded && !isAuthenticated;
  const deepIpBlocked =
    scanMode === "deep" && authLoaded && targetKind === "ip";
  const deepOwnershipBlocked =
    scanMode === "deep" &&
    authLoaded &&
    isAuthenticated &&
    Boolean(apexDomain) &&
    verification?.status !== "verified";

  return (
    <div className="w-full space-y-6 text-left">
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="scan-target" className="sr-only">
            Dominio o URL
          </label>
          <div
            className={cn(
              "flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-4 py-1 shadow-sm transition-[border-color,box-shadow] duration-150",
              "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30",
            )}
          >
            <Input
              id="scan-target"
              name="target"
              value={target}
              onChange={(e) => onTargetChange(e.target.value.slice(0, 256))}
              placeholder="Dominio o URL — example.com"
              maxLength={256}
              disabled={loading}
              className={cn(
                "min-h-12 flex-1 border-0 bg-transparent px-0 py-3 font-mono text-base shadow-none",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "placeholder:text-muted-foreground/80",
              )}
              autoComplete="off"
            />
            <span className="hidden shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground sm:block">
              {charCount}/256
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <p id="scan-mode-label" className="sr-only">
            Modo de escaneo
          </p>
          <div
            className="flex flex-wrap justify-center gap-2 sm:justify-start"
            role="group"
            aria-labelledby="scan-mode-label"
          >
            {MODE_OPTIONS.map((opt) => {
              const selected = scanMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  title={opt.desc}
                  disabled={loading}
                  onClick={() => onScanModeChange(opt.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    "disabled:pointer-events-none disabled:opacity-40",
                    selected
                      ? "border-primary/50 bg-primary text-primary-foreground shadow-sm"
                      : "border-border/60 bg-background text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  {opt.label}
                  {opt.id === "deep" && !isAuthenticated ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-fit border px-1 py-0 text-[9px] font-bold uppercase tracking-wider",
                        selected
                          ? "border-primary-foreground/40 bg-primary-foreground/15 text-primary-foreground"
                          : "border-primary/30 bg-primary/5 text-primary",
                      )}
                    >
                      Cuenta
                    </Badge>
                  ) : null}
                </button>
              );
            })}
          </div>
          <p className="text-center text-[11px] leading-snug text-muted-foreground sm:text-left">
            {MODE_OPTIONS.find((o) => o.id === scanMode)?.desc}
            {scanMode === "deep" && !isAuthenticated ? (
              <>
                {" "}
                <SignInButton mode="modal">
                  <span className="cursor-pointer font-medium text-primary underline decoration-primary/40 underline-offset-2">
                    Inicia sesión
                  </span>
                </SignInButton>{" "}
                para modo profundo.
              </>
            ) : null}
          </p>
        </div>

        <p className="text-center text-[11px] leading-relaxed text-muted-foreground sm:text-left">
          Solo objetivos tuyos o con autorización explícita. Pasivo: DNS y HTTPS
          públicos; sin vigilancia intrusiva ni tiempo real.
        </p>

        <Button
          type="submit"
          disabled={
            loading ||
            !target.trim() ||
            deepRequiresAuth ||
            deepOwnershipBlocked ||
            deepIpBlocked
          }
          size="lg"
          className="h-12 w-full rounded-full text-sm font-semibold shadow-sm transition-colors duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-40"
        >
          {loading ? "Ejecutando módulos…" : "Lanzar comprobaciones"}
        </Button>

        {scanMode === "deep" &&
        isAuthenticated &&
        apexDomain &&
        verification === undefined ? (
          <p
            className="text-center text-[11px] text-muted-foreground"
            role="status"
          >
            Comprobando titularidad del dominio…
          </p>
        ) : null}

        {scanMode === "deep" &&
        isAuthenticated &&
        apexDomain &&
        verification !== undefined &&
        verification?.status !== "verified" &&
        !deepIpBlocked ? (
          <>
            <p className="text-center text-[11px] leading-snug text-muted-foreground">
              El modo profundo solo corre tras verificar el apex{" "}
              <span className="font-mono text-foreground">{apexDomain}</span>.
            </p>
            <OwnershipVerificationSection
              apexDomain={apexDomain}
              verification={verification}
              disabled={loading}
              onVerified={onOwnershipVerified}
            />
          </>
        ) : null}

        {deepIpBlocked ? (
          <p
            className="text-center text-xs text-amber-700 dark:text-amber-500/90"
            role="status"
          >
            El modo profundo no admite solo IP. Usa un nombre de dominio o
            cambia a <strong>modo rápido</strong>.
          </p>
        ) : null}

        {deepRequiresAuth ? (
          <p className="text-center text-xs text-primary" role="status">
            <SignInButton mode="modal">
              <span className="cursor-pointer underline underline-offset-2 transition-colors hover:text-primary">
                Entra o crea cuenta
              </span>
            </SignInButton>{" "}
            o elige <strong>modo rápido</strong>.
          </p>
        ) : null}

        {error ? (
          <p className="text-center text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      <p className="flex items-start gap-2.5 text-[11px] leading-relaxed text-muted-foreground">
        <Zap
          className="mt-px size-4 shrink-0 text-primary"
          aria-hidden
        />
        <span>
          <span className="font-semibold text-foreground">Tip:</span> dominios
          grandes sirven como demo; sin hostname claro, el TLS puede verse
          distinto a producción real.
        </span>
      </p>
    </div>
  );
}
