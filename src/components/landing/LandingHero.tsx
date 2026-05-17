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
        className="inline-flex rounded-full border-cyan-400/35 bg-cyan-500/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300 shadow-none hover:bg-cyan-500/5"
      >
        Cyber Twin Protocol
      </Badge>
      <h1 className="mt-8 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
        Detección de amenazas{" "}
        <GradientText as="span" className="block sm:inline">
          en tiempo real
        </GradientText>
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
        Visualiza la superficie de ataque de tu dominio con reconocimiento pasivo:
        subdominios, email auth, TLS e insights con IA — explicado para equipos sin
        especialista en seguridad.
      </p>
      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href="/scan"
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "btn-gradient-neon inline-flex min-h-12 rounded-xl px-8 text-sm shadow-[0_0_40px_rgba(34,211,238,0.25)]",
          )}
        >
          Iniciar escaneo →
        </Link>
        <Link
          href="/scan"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "inline-flex min-h-12 rounded-xl border-cyan-400/40 px-8 text-sm font-medium text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-200 dark:border-cyan-400/40 dark:bg-transparent",
          )}
        >
          Ver panel
        </Link>
      </div>
    </section>
  );
}
