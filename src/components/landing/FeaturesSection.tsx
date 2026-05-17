import { FEATURES } from "@/data/features";
import { FeatureIcon } from "@/components/ui/FeatureIcon";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function featureGridItemClass(index: number, total: number): string {
  const classes = ["h-full"];

  const lgRemainder = total % 3;
  if (lgRemainder === 1 && index === total - 1) {
    classes.push("lg:col-start-2");
  } else if (lgRemainder === 2) {
    if (index === total - 2) classes.push("lg:col-start-1");
    if (index === total - 1) classes.push("lg:col-start-2");
  }

  const smRemainder = total % 2;
  if (smRemainder === 1 && index === total - 1) {
    classes.push("sm:col-span-2 sm:mx-auto sm:max-w-md sm:justify-self-center");
  }

  return cn(classes);
}

export function FeaturesSection() {
  const total = FEATURES.length;

  return (
    <section id="funcionalidades" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-foreground/80">
          Pipeline determinístico
        </p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">
          Lo que ejecuta el servidor hoy — y próximos refuerzos
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
          Cada módulo revisa algo medible desde fuera, sin lanzar exploits. La IA aparece después y solo ordena ayuda cuando tú la pides — no definimos seguridad únicamente desde un chat.
        </p>
      </div>
      <ul className="mt-12 grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, index) => (
          <li key={feature.id} className={featureGridItemClass(index, total)}>
            <Card
              className={cn(
                "group h-full gap-0 border border-border py-0 shadow-sm transition hover:shadow-md",
              )}
            >
              <CardContent className="flex h-full min-h-[220px] flex-col p-6">
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
                    {feature.status === "live" ? "En producción" : "En roadmap"}
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
