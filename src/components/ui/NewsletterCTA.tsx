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
        "mx-auto max-w-4xl gap-0 border border-border py-0 shadow-sm",
      )}
    >
      <CardContent className="px-6 py-10 sm:px-10">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-foreground/80">
            Newsletter semanal
          </p>
          <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
            Resiliencia práctica cada semana
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Alertas sobre parches, patrones típicos de configuración débil en
            dominios públicos y pasos útiles para equipos PYME sin CISO —
            comunidad Hack LATAM.
          </p>
        </div>
        {sent ? (
          <p
            className="mt-6 text-center text-sm font-medium text-accent"
            role="status"
          >
            Gracias. Te avisaremos cuando el envío semanal esté activo.
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
              className="min-h-12 flex-1 rounded-xl border-input bg-background px-4 font-mono text-sm"
            />
            <Button
              type="submit"
              className="min-h-12 shrink-0 rounded-xl px-6 text-sm"
            >
              Unirme →
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
