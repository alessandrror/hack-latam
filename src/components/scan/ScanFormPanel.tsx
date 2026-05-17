"use client";

import Link from "next/link";
import type { FormEvent } from "react";

export type ScanMode = "deep" | "quick";

type ScanFormPanelProps = {
  target: string;
  onTargetChange: (value: string) => void;
  scanMode: ScanMode;
  onScanModeChange: (mode: ScanMode) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  error: string | null;
};

export function ScanFormPanel({
  target,
  onTargetChange,
  scanMode,
  onScanModeChange,
  onSubmit,
  loading,
  error,
}: ScanFormPanelProps) {
  const charCount = target.length;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-cyan-300"
      >
        ← Volver
      </Link>
      <h1 className="mt-8 text-3xl font-bold text-white sm:text-4xl">
        Escanear infraestructura{" "}
        <span className="text-gradient-neon">objetivo</span>
      </h1>
      <p className="mt-3 text-sm text-slate-400">
        Ingresa un dominio o URL. Solo reconocimiento pasivo — sin explotación.
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
          <input
            id="scan-target"
            name="target"
            value={target}
            onChange={(e) =>
              onTargetChange(e.target.value.slice(0, 256))
            }
            placeholder="example.com o https://www.example.com"
            maxLength={256}
            disabled={loading}
            className="neon-input w-full rounded-xl px-4 py-4 font-mono text-sm text-slate-100 placeholder:text-slate-600"
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
            <button
              key={opt.id}
              type="button"
              onClick={() => onScanModeChange(opt.id)}
              disabled={loading}
              className={`neon-panel flex items-start gap-3 p-4 text-left transition ${
                scanMode === opt.id
                  ? "border-cyan-400/50 ring-1 ring-cyan-400/30"
                  : "opacity-80 hover:border-slate-600"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">{opt.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  {opt.desc}
                </p>
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
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || !target.trim()}
          className="flex w-full min-h-14 items-center justify-center gap-2 rounded-xl btn-gradient-neon text-base shadow-[0_0_50px_rgba(34,211,238,0.2)]"
        >
          {loading ? "Escaneando…" : "Iniciar escaneo cibernético"}
          {!loading ? <span aria-hidden>→</span> : null}
        </button>

        {error ? (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      <div className="neon-panel mt-8 flex gap-3 border-cyan-500/25 p-4 text-sm">
        <span className="text-lg" aria-hidden>
          ⚡
        </span>
        <p className="text-slate-400">
          <span className="font-semibold text-cyan-300">Tip:</span> Usa dominios
          como <span className="font-mono text-slate-300">cloudflare.com</span> para
          probar. Las IPs omiten subdominios vía CT.
        </p>
      </div>
    </div>
  );
}
