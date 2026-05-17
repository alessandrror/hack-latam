"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TARGET_ID = "landing-hero-target";

export function LandingHeroScanForm() {
  const router = useRouter();
  const [target, setTarget] = useState("");

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = target.trim().slice(0, 256);
    if (!trimmed) return;
    const params = new URLSearchParams();
    params.set("target", trimmed);
    router.push(`/scan?${params.toString()}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto mt-12 w-full max-w-2xl space-y-4 text-left"
      noValidate
      aria-label="Iniciar instantáneo de escaneo pasivo desde el inicio"
    >
      <div className="space-y-2">
        <label
          htmlFor={TARGET_ID}
          className="text-sm font-semibold text-foreground"
        >
          Dominio o URL que puedas analizar con autorización
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <Input
            id={TARGET_ID}
            name="target"
            type="text"
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            placeholder="ejemplo.com o https://www.ejemplo.com"
            value={target}
            onChange={(e) => setTarget(e.target.value.slice(0, 256))}
            maxLength={256}
            className="min-h-12 w-full min-w-0 flex-1 rounded-xl border-input bg-card px-4 py-3 font-mono text-base text-foreground shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
          <Button
            type="submit"
            size="lg"
            className="min-h-12 shrink-0 rounded-xl px-8 text-base font-semibold"
            disabled={!target.trim()}
          >
            Comprobar dominio pasivo
          </Button>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Pasamos este objetivo al panel; allí eliges modo rápido (prioriza lo urgente)
          o profundo (todas las comprobaciones pasivas y checklist). Solo destinos sobre
          los que tienes derecho por ley o acuerdo.
        </p>
      </div>
    </form>
  );
}
