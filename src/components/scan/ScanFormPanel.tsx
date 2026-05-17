"use client";

import { SignInButton } from "@clerk/nextjs";
import { Zap } from "lucide-react";
import type { FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
};

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
}: ScanFormPanelProps) {
  const charCount = target.length;
  const deepRequiresAuth =
    scanMode === "deep" && authLoaded && !isAuthenticated;

  return (
    <div className="mx-auto w-full max-w-2xl text-center">
      <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
        Revisa tu{" "}
        <span className="font-semibold text-primary">
          superficie externa pública
        </span>
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Introduce el dominio o URL de propiedades que puedas escanear por
        ley/política. Solo datos públicos y acuerdos HTTPS normales (puerto{" "}
        <span className="font-mono">443</span>
        ) — sin explotación. El modo{" "}
        <span className="font-semibold text-accent">rápido</span> sirve como
        comprobación prioritaria; el{" "}
        <span className="font-semibold text-accent">profundo</span> activa todas
        las comprobaciones pasivas del servidor y necesita cuenta.
      </p>

      <form onSubmit={onSubmit} className="mt-10 space-y-6 text-left">
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label
              htmlFor="scan-target"
              className="text-sm font-medium text-foreground"
            >
              Dominio o URL autorizado
            </label>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {charCount}/256
            </span>
          </div>
          <Input
            id="scan-target"
            name="target"
            value={target}
            onChange={(e) => onTargetChange(e.target.value.slice(0, 256))}
            placeholder="example.com o https://www.example.com"
            maxLength={256}
            disabled={loading}
            className="min-h-16 w-full rounded-xl border-input bg-background px-5 py-5 font-mono text-base transition-[box-shadow,border-color] duration-200 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            autoComplete="off"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              {
                id: "deep" as const,
                title: "Profundo",
                desc: "Todos los módulos pasivos y checklist técnico (requiere cuenta).",
              },
              {
                id: "quick" as const,
                title: "Rápido",
                desc: "Omitimos parte de CT y los hallazgos de nivel bajo: prioriza lo urgente.",
              },
            ] as const
          ).map((opt) => (
            <Button
              key={opt.id}
              type="button"
              variant="ghost"
              onClick={() => onScanModeChange(opt.id)}
              disabled={loading}
              className={cn(
                "flex h-auto w-full shrink-0 cursor-pointer items-start justify-start gap-2.5 rounded-xl border border-border bg-card p-3 text-left font-normal shadow-sm transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                scanMode === opt.id
                  ? "border-primary ring-1 ring-primary/25"
                  : "opacity-90 hover:border-input",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-1.5 font-semibold text-foreground">
                  {opt.title}
                  {opt.id === "deep" && !isAuthenticated ? (
                    <Badge
                      variant="outline"
                      className="h-fit border-primary/25 bg-primary/5 px-1.5 py-0 text-[10px] font-bold uppercase tracking-wider text-primary"
                    >
                      Cuenta
                    </Badge>
                  ) : null}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground sm:text-xs">
                  {opt.desc}
                </p>
                {opt.id === "deep" && !isAuthenticated ? (
                  <p className="mt-2 text-[11px] leading-snug text-amber-800">
                    <SignInButton mode="modal">
                      <span className="underline decoration-accent/70 underline-offset-2 transition-colors hover:text-accent">
                        Inicia sesión
                      </span>
                    </SignInButton>{" "}
                    para ejecutar este modo.
                  </p>
                ) : null}
              </div>
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200",
                  scanMode === opt.id
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/40",
                )}
                aria-hidden
              >
                {scanMode === opt.id ? (
                  <span className="h-2 w-2 rounded-full bg-primary-foreground" />
                ) : null}
              </span>
            </Button>
          ))}
        </div>

        <p className="rounded-lg border border-border bg-muted/40 px-3 py-3 text-xs leading-relaxed text-muted-foreground">
          Solo analiza dominios de tu empresa o sobre los que tengas autorización
          por escrito o contrato equivalente.
        </p>

        <Button
          type="submit"
          disabled={loading || !target.trim() || deepRequiresAuth}
          size="lg"
          className="flex min-h-14 w-full cursor-pointer gap-2 rounded-xl text-base transition active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40"
        >
          {loading ? "Analizando…" : "Ejecutar análisis pasivo"}
          {!loading ? <span aria-hidden>→</span> : null}
        </Button>

        {deepRequiresAuth ? (
          <p className="text-center text-sm text-amber-800" role="status">
            Seleccionaste el modo{" "}
            <strong>profundo</strong>.{" "}
            <SignInButton mode="modal">
              <span className="underline decoration-accent underline-offset-2 transition-colors hover:text-accent">
                Entra o crea una cuenta
              </span>
            </SignInButton>{" "}
            para continuar, o cambia a <strong>modo rápido</strong>.
          </p>
        ) : null}

        {error ? (
          <p className="text-center text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      <Card className="mt-8 gap-0 border border-border py-0 text-left shadow-sm">
        <CardContent className="flex gap-3 p-4 text-sm">
          <Zap
            className="mt-0.5 h-5 w-5 shrink-0 text-accent"
            aria-hidden
          />
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">Tip:</span> Ejemplos como{" "}
            <span className="font-mono text-foreground">cloudflare.com</span> ayudan
            a conocer la UI. Si solo tienes IPv4 sin hostname, omitimos huellas CT y
            parte de TLS esperado por SNI — mejor un nombre de dominio.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
