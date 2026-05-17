"use client";

import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import type { FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
    <div className="mx-auto max-w-2xl">
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 inline-flex h-auto items-center gap-1 px-2 py-1 text-sm text-slate-500 hover:bg-transparent hover:text-cyan-300",
        )}
      >
        ← Volver
      </Link>
      <h1 className="mt-8 text-3xl font-bold text-white sm:text-4xl">
        Escanear infraestructura{" "}
        <span className="text-gradient-neon">objetivo</span>
      </h1>
      <p className="mt-3 text-sm text-slate-400">
        Ingresa un dominio o URL. Solo reconocimiento pasivo — sin explotación.
        El{" "}
        <span className="font-semibold text-cyan-300/95">escaneo rápido</span> es
        libre para invitados; el{" "}
        <span className="font-semibold text-cyan-300/95">análisis profundo</span>{" "}
        requiere cuenta para guardarte el historial.
      </p>

      <form onSubmit={onSubmit} className="mt-10 space-y-6">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="scan-target"
              className="text-sm font-medium text-slate-200"
            >
              Dirección objetivo
            </label>
            <span className="font-mono text-xs text-cyan-400/80">
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
            className="neon-input min-h-14 w-full rounded-xl px-4 py-4 font-mono text-sm text-slate-100 placeholder:text-slate-600"
            autoComplete="off"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              {
                id: "deep" as const,
                title: "Análisis profundo",
                desc: "Todos los módulos + checklist completo. Recomendado para auditorías.",
              },
              {
                id: "quick" as const,
                title: "Escaneo rápido",
                desc: "Misma pasividad, enfoque en hallazgos críticos y medios.",
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
                "neon-panel flex h-auto w-full shrink-0 items-start justify-start gap-3 p-4 text-left font-normal shadow-none hover:bg-transparent",
                scanMode === opt.id
                  ? "border-cyan-400/50 ring-1 ring-cyan-400/30"
                  : "opacity-80 hover:border-slate-600",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold text-white">
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
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  {opt.desc}
                </p>
                {opt.id === "deep" && !isAuthenticated ? (
                  <p className="mt-3 text-[11px] leading-relaxed text-amber-200/95">
                    <SignInButton mode="modal">
                      <span className="underline decoration-cyan-400/70 underline-offset-2 hover:text-cyan-100">
                        Inicia sesión
                      </span>
                    </SignInButton>{" "}
                    para ejecutar este modo.
                  </p>
                ) : null}
              </div>
              <span
                className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  scanMode === opt.id
                    ? "border-cyan-400 bg-cyan-400"
                    : "border-slate-600"
                }`}
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
          className="btn-gradient-neon flex min-h-14 w-full gap-2 rounded-xl text-base shadow-[0_0_50px_rgba(34,211,238,0.2)] disabled:opacity-40"
        >
          {loading ? "Escaneando…" : "Iniciar escaneo cibernético"}
          {!loading ? <span aria-hidden>→</span> : null}
        </Button>

        {deepRequiresAuth ? (
          <p className="text-sm text-amber-200/90" role="status">
            Seleccionaste <strong>análisis profundo</strong>.{" "}
            <SignInButton mode="modal">
              <span className="underline decoration-cyan-400 underline-offset-2 hover:text-cyan-100">
                Entra o crea una cuenta
              </span>
            </SignInButton>{" "}
            para continuar, o cambia a <strong>escaneo rápido</strong>.
          </p>
        ) : null}

        {error ? (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      <Card className="neon-panel mt-8 gap-0 border-cyan-500/25 py-0 shadow-none ring-0">
        <CardContent className="flex gap-3 p-4 text-sm">
          <span className="text-lg" aria-hidden>
            ⚡
          </span>
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
