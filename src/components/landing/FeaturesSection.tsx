import { FEATURES } from "@/data/features";
import { FeatureIcon } from "@/components/ui/FeatureIcon";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function FeaturesSection() {
  return (
    <section id="funcionalidades" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-foreground/80">
          Plataforma
        </p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">
          Funcionalidades actuales y roadmap
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
          Comprobaciones defensivas que ya ejecuta el servidor (sin ataques ni
          explotación) y lo que sigue en el roadmap del hackathon.
        </p>
      </div>
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <li key={feature.id}>
            <Card
              className={cn(
                "group gap-0 border border-border py-0 shadow-sm transition hover:shadow-md",
              )}
            >
              <CardContent className="flex flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <FeatureIcon icon={feature.icon} />
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 px-2.5 py-1 text-xs font-bold uppercase tracking-wide shadow-none",
                      feature.status === "live"
                        ? "border-transparent bg-accent text-accent-foreground hover:bg-accent"
                        : "border-border bg-secondary text-secondary-foreground hover:bg-secondary",
                    )}
                  >
                    {feature.status === "live" ? "Activo" : "Próximo"}
                  </Badge>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
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
