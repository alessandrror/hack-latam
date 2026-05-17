import { AlertTriangle, Lightbulb, Target } from "lucide-react";

import type { BlogPost } from "@/data/blog-posts";
import { Card, CardContent } from "@/components/ui/card";

type BlogArticleSectionsProps = {
  post: BlogPost;
};

const sections = [
  {
    key: "problem",
    title: "El problema",
    icon: Target,
    field: "problem" as const,
  },
  {
    key: "impact",
    title: "Impacto en tu negocio",
    icon: AlertTriangle,
    field: "impact" as const,
  },
] as const;

export function BlogArticleSections({ post }: BlogArticleSectionsProps) {
  return (
    <div className="space-y-6">
      {sections.map(({ key, title, icon: Icon, field }) => (
        <section key={key}>
          <Card className="gap-0 overflow-hidden border border-border py-0 shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h2 className="text-xl font-semibold text-foreground">{title}</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                {post[field]}
              </p>
            </CardContent>
          </Card>
        </section>
      ))}

      <section>
        <Card className="gap-0 overflow-hidden border border-border py-0 shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Lightbulb className="h-5 w-5" aria-hidden />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              Recomendaciones prácticas
            </h2>
            <ol className="mt-5 space-y-4">
              {post.recommendations.map((rec, index) => (
                <li key={rec.slice(0, 48)} className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <p className="pt-0.5 text-base leading-relaxed text-muted-foreground">
                    {rec}
                  </p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
