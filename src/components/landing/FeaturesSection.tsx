import { FEATURES } from "@/data/features";
import { FeatureIcon } from "@/components/ui/FeatureIcon";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function FeaturesSection() {
  return (
    <section id="funcionalidades" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
          Plataforma
        </p>
        <h2 className="mt-3 text-3xl font-bold text-white">
          Funcionalidades actuales y roadmap
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400">
          Módulos pasivos que ya corren en el escáner y capacidades planeadas para
          la próxima iteración del hackathon.
        </p>
      </div>
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <li key={feature.id}>
            <Card
              className={cn(
                "neon-panel group gap-0 py-0 shadow-none ring-0 transition hover:border-fuchsia-500/30 hover:shadow-[0_0_30px_rgba(232,121,249,0.08)]",
              )}
            >
              <CardContent className="flex flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <FeatureIcon icon={feature.icon} />
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-none hover:bg-transparent",
                      feature.status === "live"
                        ? "border-cyan-500/30 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/15 dark:border-cyan-500/30"
                        : "border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-300 hover:bg-fuchsia-500/10 dark:border-fuchsia-500/25",
                    )}
                  >
                    {feature.status === "live" ? "Activo" : "Próximo"}
                  </Badge>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
