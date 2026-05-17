import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SearchHeroProps = {
  target: string;
  onTargetChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  error: string | null;
  inputId?: string;
};

export function SearchHero({
  target,
  onTargetChange,
  onSubmit,
  loading,
  error,
  inputId = "target-hero",
}: SearchHeroProps) {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col justify-center px-6 py-16">
      <div className="mx-auto w-full max-w-xl space-y-8 text-center">
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-widest text-accent">
            Hack LATAM — Huella externa pasiva
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Qué se ve ya en público sobre un dominio
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            Comprobaciones defensivas: nombres en transparencia de certificados,
            señales DNS de correo (SPF, DMARC y pistas de DKIM) y datos del
            certificado HTTPS — en texto plano para equipos PYME (solo objetivos que
            debas poder analizar).
          </p>
        </header>

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 text-left shadow-sm"
        >
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            Dominio o URL (solo con autorización)
          </label>
          <Input
            id={inputId}
            name="target"
            value={target}
            onChange={(e) => onTargetChange(e.target.value)}
            placeholder="example.com o https://www.example.com"
            className="min-h-11 rounded-xl border-input bg-background px-4 py-3 font-mono text-base"
            autoComplete="off"
            disabled={loading}
          />
          <Button
            type="submit"
            disabled={loading || !target.trim()}
            size="lg"
            className="inline-flex min-h-11 justify-center rounded-xl text-sm font-semibold"
          >
            {loading ? "Analizando…" : "Obtener informe"}
          </Button>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
