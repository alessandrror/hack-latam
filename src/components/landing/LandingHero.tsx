import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { GradientText } from "@/components/ui/GradientText";
import { cn } from "@/lib/utils";

export function LandingHero() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
      <Badge
        variant="outline"
        className="inline-flex rounded-full border-border bg-secondary px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] text-foreground/85 shadow-none hover:bg-secondary"
      >
        Recon pasivo · Defensa
      </Badge>
      <h1 className="mt-8 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
        Lo que Internet ya muestra{" "}
        <GradientText as="span" className="block sm:inline">
          sobre tu dominio
        </GradientText>
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
        Un informe en lenguaje claro a partir de datos públicos: huella en
        transparencia de certificados, SPF/DMARC/DKIM y certificado HTTPS en :443.
        La IA resume pasos de verificación y remediación — tú decides qué aplicar.
      </p>
      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href="/scan"
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "inline-flex min-h-12 rounded-xl px-8 text-sm",
          )}
        >
          Analizar mi dominio →
        </Link>
        <Link
          href="/scan"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "inline-flex min-h-12 rounded-xl border-border px-8 text-sm font-medium text-foreground hover:bg-muted",
          )}
        >
          Abrir el panel
        </Link>
      </div>
    </section>
  );
}
