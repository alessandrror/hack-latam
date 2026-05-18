"use client";

import { useEffect, useRef, useState } from "react";

import { FEATURES, type Feature } from "@/data/features";
import { FeatureIcon } from "@/components/ui/FeatureIcon";
import { cn } from "@/lib/utils";

const LIVE_BENTO_SPANS = [
  "lg:col-span-7",
  "lg:col-span-5",
  "lg:col-span-5",
  "lg:col-span-7",
] as const;

const PARTICLES = [
  "left-[8%] top-[18%] h-1 w-1 [animation-delay:0s]",
  "left-[22%] top-[72%] h-1.5 w-1.5 [animation-delay:1.2s]",
  "left-[78%] top-[25%] h-1 w-1 [animation-delay:0.6s]",
  "left-[88%] top-[58%] h-1 w-1 [animation-delay:2s]",
  "left-[55%] top-[12%] h-1 w-1 [animation-delay:1.8s]",
  "left-[38%] top-[88%] h-1.5 w-1.5 [animation-delay:0.9s]",
] as const;

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);
  return mounted;
}

function useSectionReveal(threshold = 0.08) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -24px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function ModuleCard({
  feature,
  moduleLabel,
  spanClass,
  visible,
  delayMs,
}: {
  feature: Feature;
  moduleLabel: string;
  spanClass?: string;
  visible: boolean;
  delayMs: number;
}) {
  const isLive = feature.status === "live";

  return (
    <li
      className={cn("feature-reveal h-full", spanClass, visible && "is-visible")}
      style={visible ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      <article
        className={cn(
          "group feature-card-scan relative flex h-full min-h-[200px] flex-col overflow-hidden rounded-2xl p-6 ring-1 transition duration-500",
          isLive
            ? "feature-card-live bg-gradient-to-br from-card/90 via-card to-primary/10 ring-primary/25 shadow-[0_12px_40px_-12px_rgba(2,132,199,0.35)] hover:-translate-y-1.5 hover:ring-primary/50 hover:shadow-[0_24px_56px_-16px_rgba(2,132,199,0.45)]"
            : "feature-card-roadmap bg-card/30 ring-border/50 ring-dashed hover:-translate-y-0.5 hover:bg-card/50 hover:ring-muted-foreground/30",
        )}
      >
        <div
          className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 rounded-full bg-primary/10 blur-3xl transition duration-700 group-hover:scale-110 group-hover:bg-primary/20"
          aria-hidden
        />

        <div
          className={cn(
            "pointer-events-none absolute bottom-0 left-0 h-px bg-gradient-to-r from-primary/80 to-transparent transition-all duration-700 group-hover:w-full",
            isLive ? "feature-card-live-accent" : "w-0",
          )}
          aria-hidden
        />

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              {isLive && (
                <span
                  className="live-pulse-ring absolute -inset-1 rounded-xl bg-primary/20"
                  aria-hidden
                />
              )}
              <div
                className={cn(
                  "relative flex h-11 w-11 items-center justify-center rounded-xl ring-1 transition duration-500 group-hover:rotate-3 group-hover:scale-110",
                  isLive
                    ? "feature-icon-live bg-primary/15 ring-primary/40"
                    : "bg-muted/40 ring-border",
                )}
              >
                <FeatureIcon icon={feature.icon} />
              </div>
            </div>
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {moduleLabel}
            </span>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition duration-300",
              isLive
                ? "bg-primary text-primary-foreground group-hover:shadow-[0_0_20px_rgba(2,132,199,0.5)]"
                : "bg-secondary/80 text-secondary-foreground ring-1 ring-border",
            )}
          >
            {isLive ? "En produccion" : "Roadmap"}
          </span>
        </div>

        <h3 className="relative mt-5 text-lg font-semibold leading-snug text-foreground transition duration-300 group-hover:text-primary">
          {feature.title}
        </h3>
        <p className="relative mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {feature.description}
        </p>

        {isLive && (
          <div className="relative mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-primary/80">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Modulo activo
          </div>
        )}
      </article>
    </li>
  );
}

function FeaturesAmbientLayer() {
  return (
    <>
      <div
        className="features-grid-full pointer-events-none absolute inset-0"
        aria-hidden
      />
      <div
        className="features-ambient-glow pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/8 to-transparent"
        aria-hidden
      />
      <div
        className="features-orb pointer-events-none absolute left-0 top-1/4 h-72 w-72 max-w-[45vw] rounded-full bg-primary/12 blur-[100px]"
        aria-hidden
      />
      <div
        className="features-orb pointer-events-none absolute right-0 bottom-1/4 h-64 w-64 max-w-[42vw] rounded-full bg-sky-400/10 blur-[90px] [animation-delay:3s]"
        aria-hidden
      />
      {PARTICLES.map((particleClass) => (
        <span
          key={particleClass}
          className={cn(
            "features-particle pointer-events-none absolute rounded-full bg-primary/60",
            particleClass,
          )}
          aria-hidden
        />
      ))}
    </>
  );
}

export function FeaturesSection() {
  const mounted = useMounted();
  const { ref, visible } = useSectionReveal();
  const live = FEATURES.filter((f) => f.status === "live");
  const roadmap = FEATURES.filter((f) => f.status === "soon");

  return (
    <section
      id="funcionalidades"
      ref={ref}
      className="features-section-bg relative isolate w-full overflow-x-clip py-20 sm:py-28"
    >
      {mounted ? <FeaturesAmbientLayer /> : null}

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10">
        <div
          className={cn(
            "feature-reveal relative text-center",
            visible && "is-visible",
          )}
        >
          <p className="features-pipeline-badge inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary ring-1 ring-primary/20">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Pipeline deterministico
          </p>
          <h2 className="mt-6 text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            <span className={cn(visible && "features-title-shimmer")}>
              Lo que ejecuta el servidor hoy
            </span>
            <span className="mt-2 block text-xl font-semibold text-muted-foreground sm:text-2xl">
              y los refuerzos en camino
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Cada modulo revisa algo medible desde fuera, sin exploits. La IA ordena
            ayuda solo cuando la pides; la fuente de verdad sigue siendo el escaneo
            estructurado.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <span
              className={cn(
                "features-stat-pop features-stat-glow rounded-xl bg-primary/10 px-4 py-2 font-mono text-sm text-primary ring-1 ring-primary/25",
                visible && "is-visible",
              )}
              style={visible ? { animationDelay: "200ms" } : undefined}
            >
              {live.length} modulos activos
            </span>
            <span
              className={cn(
                "features-stat-pop rounded-xl bg-muted/40 px-4 py-2 font-mono text-sm text-muted-foreground ring-1 ring-border/60",
                visible && "is-visible",
              )}
              style={visible ? { animationDelay: "320ms" } : undefined}
            >
              {roadmap.length} en roadmap
            </span>
          </div>
        </div>

        <div className="relative mt-16 lg:mt-20">
          <div className="mb-5 flex items-center gap-3 px-1">
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              01 · Pipeline activo
            </span>
            <div className="h-px flex-1 pipeline-line-animated opacity-70" aria-hidden />
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
            {live.map((feature, index) => (
              <ModuleCard
                key={feature.id}
                feature={feature}
                moduleLabel={`MOD-${String(index + 1).padStart(2, "0")}`}
                spanClass={cn("sm:col-span-1", LIVE_BENTO_SPANS[index])}
                visible={visible}
                delayMs={100 + index * 100}
              />
            ))}
          </ul>
        </div>

        <div
          className={cn(
            "feature-reveal relative mt-16 lg:mt-20",
            visible && "is-visible",
          )}
          style={visible ? { animationDelay: "450ms" } : undefined}
        >
          <div className="mb-5 flex items-center gap-3 px-1">
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              02 · Proximos modulos
            </span>
            <div
              className="features-roadmap-line h-px flex-1 border-t border-dashed border-border/60"
              aria-hidden
            />
          </div>

          <ul className="grid gap-4 md:grid-cols-3">
            {roadmap.map((feature, index) => (
              <ModuleCard
                key={feature.id}
                feature={feature}
                moduleLabel={`RDM-${String(index + 1).padStart(2, "0")}`}
                visible={visible}
                delayMs={550 + index * 90}
              />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
