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
      <h1 className="text-3xl font-bold text-white sm:text-4xl">
        Escanear infraestructura{" "}
        <span className="text-gradient-neon">objetivo</span>
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
        Ingresa un dominio o URL. Solo reconocimiento pasivo — sin explotación.
        El{" "}
        <span className="font-semibold text-cyan-300/95">escaneo rápido</span>{" "}
        es libre para invitados; el{" "}
        <span className="font-semibold text-cyan-300/95">análisis profundo</span>{" "}
        requiere cuenta para guardarte el historial.
      </p>

      <form onSubmit={onSubmit} className="mt-10 space-y-6 text-left">
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label
              htmlFor="scan-target"
              className="text-sm font-medium text-slate-200"
            >
              Dirección objetivo
            </label>
            <span className="font-mono text-xs tabular-nums text-cyan-400/80">
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
            className="neon-input min-h-16 w-full rounded-xl px-5 py-5 font-mono text-base text-slate-100 placeholder:text-slate-600 transition-[box-shadow,border-color] duration-200 focus-visible:ring-2 focus-visible:ring-cyan-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030308]"
            autoComplete="off"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              {
                id: "deep" as const,
                title: "Análisis profundo",
                desc: "Todos los módulos + checklist. Ideal para auditorías.",
              },
              {
                id: "quick" as const,
                title: "Escaneo rápido",
                desc: "Pasivo; prioriza hallazgos críticos y medios.",
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
                "neon-panel flex h-auto w-full shrink-0 cursor-pointer items-start justify-start gap-2.5 p-3 text-left font-normal shadow-none transition-[border-color,opacity,ring] duration-200 hover:bg-cyan-500/6 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-cyan-400/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030308]",
                scanMode === opt.id
                  ? "border-cyan-400/50 ring-1 ring-cyan-400/30"
                  : "opacity-80 hover:border-slate-600",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-1.5 font-semibold text-white">
                  {opt.title}
                  {opt.id === "deep" && !isAuthenticated ? (
                    <Badge
                      variant="outline"
                      className="h-fit border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0 text-[10px] font-bold uppercase tracking-wider text-cyan-200 hover:bg-cyan-500/10"
                    >
                      Cuenta
                    </Badge>
                  ) : null}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-400 sm:text-xs">
                  {opt.desc}
                </p>
                {opt.id === "deep" && !isAuthenticated ? (
                  <p className="mt-2 text-[11px] leading-snug text-amber-200/95">
                    <SignInButton mode="modal">
                      <span className="underline decoration-cyan-400/70 underline-offset-2 transition-colors hover:text-cyan-100">
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
                    ? "border-cyan-400 bg-cyan-400"
                    : "border-slate-600",
                )}
                aria-hidden
              >
                {scanMode === opt.id ? (
                  <span className="h-2 w-2 rounded-full bg-[#030308]" />
                ) : null}
              </span>
            </Button>
          ))}
        </div>

        <Button
          type="submit"
          disabled={loading || !target.trim() || deepRequiresAuth}
          size="lg"
          className="btn-gradient-neon flex min-h-14 w-full cursor-pointer gap-2 rounded-xl text-base shadow-[0_0_50px_rgba(34,211,238,0.2)] transition-[opacity,transform] duration-200 hover:brightness-105 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030308]"
        >
          {loading ? "Escaneando…" : "Iniciar escaneo cibernético"}
          {!loading ? <span aria-hidden>→</span> : null}
        </Button>

        {deepRequiresAuth ? (
          <p className="text-center text-sm text-amber-200/90" role="status">
            Seleccionaste <strong>análisis profundo</strong>.{" "}
            <SignInButton mode="modal">
              <span className="underline decoration-cyan-400 underline-offset-2 transition-colors hover:text-cyan-100">
                Entra o crea una cuenta
              </span>
            </SignInButton>{" "}
            para continuar, o cambia a <strong>escaneo rápido</strong>.
          </p>
        ) : null}

        {error ? (
          <p className="text-center text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      <Card className="neon-panel mt-8 gap-0 border-cyan-500/25 py-0 text-left shadow-none ring-0 transition-colors duration-200 hover:border-cyan-500/35">
        <CardContent className="flex gap-3 p-4 text-sm">
          <Zap
            className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400/90"
            aria-hidden
          />
          <p className="text-slate-400">
            <span className="font-semibold text-cyan-300">Tip:</span> Usa
            dominios como{" "}
            <span className="font-mono text-slate-300">cloudflare.com</span> para
            probar. Las IPs omiten subdominios vía CT.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
