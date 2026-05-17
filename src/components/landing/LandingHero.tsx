import Link from "next/link";

import { LandingHeroScanForm } from "@/components/landing/LandingHeroScanForm";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingHero() {
  return (
    <section
      className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24"
      aria-labelledby="landing-hero-heading"
    >
      <div className="text-center">
        <Badge
          variant="outline"
          className="inline-flex rounded-full border-primary/40 bg-primary/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] text-primary shadow-none"
        >
          Superficie externa pasiva · PYME
        </Badge>
        <h1
          id="landing-hero-heading"
          className="mt-8 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[clamp(2.25rem,6vw,3.75rem)] lg:leading-[1.08]"
        >
          ¿Qué se ve ya{" "}
          <span className="text-primary">en público</span> sobre tu dominio?
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          Te damos un instantáneo de señales que cualquier observador externo también
          puede revisar — correo (SPF/DMARC/DKIM), HTTPS en :443 y, en modo profundo,
          huella por transparencia de certificados. Sin explotación, sin pentest
          automatizado ni promesa de cobertura total. Opcionalmente, la IA sugiere qué
          validar después; las comprobaciones estructuradas son la fuente principal.
        </p>
      </div>

      <LandingHeroScanForm />

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
        <Link
          href="/scan"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "inline-flex min-h-11 min-w-[44px] items-center justify-center rounded-xl border-border px-6 text-sm font-medium text-foreground hover:bg-muted",
          )}
        >
          Ir al panel de escaneo
        </Link>
        <Link
          href="#funcionalidades"
          className={cn(
            buttonVariants({ variant: "ghost", size: "lg" }),
            "inline-flex min-h-11 min-w-[44px] items-center justify-center rounded-xl text-muted-foreground hover:text-foreground",
          )}
        >
          Qué chequeamos hoy
        </Link>
      </div>
    </section>
  );
}
