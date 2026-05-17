"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function NewsletterCTA({ id = "newsletter" }: { id?: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
  }

  return (
    <Card
      id={id}
      className={cn(
        "neon-panel cyber-glow-cyan mx-auto max-w-4xl gap-0 py-0 shadow-none ring-0",
      )}
    >
      <CardContent className="px-6 py-10 sm:px-10">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Newsletter semanal
          </p>
          <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
            Ciberseguridad en tu bandeja cada semana
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
            Brechas recientes, parches críticos y guías prácticas para PYMEs —
            sin tecnicismos innecesarios. Únete a la comunidad Hack LATAM.
          </p>
        </div>
        {sent ? (
          <p
            className="mt-6 text-center text-sm font-medium text-cyan-300"
            role="status"
          >
            ¡Gracias! Te avisaremos cuando el envío semanal esté activo.
          </p>
        ) : (
          <form
            onSubmit={onSubmit}
            className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Correo electrónico
            </label>
            <Input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@empresa.com"
              className="neon-input min-h-12 flex-1 rounded-xl px-4 font-mono text-sm text-slate-100 placeholder:text-slate-600"
            />
            <Button
              type="submit"
              className="btn-gradient-neon min-h-12 shrink-0 rounded-xl px-6 text-sm"
            >
              Unirme →
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
