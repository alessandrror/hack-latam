import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_POSTS, getPostBySlug } from "@/data/blog-posts";
import { CyberBackground } from "@/components/ui/CyberBackground";
import { NewsletterCTA } from "@/components/ui/NewsletterCTA";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Artículo no encontrado" };
  return {
    title: `${post.title} — Hack LATAM`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <CyberBackground>
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <Link
          href="/blog"
          className="text-sm text-muted-foreground hover:text-accent"
        >
          ← Blog
        </Link>
        <p className="mt-8 text-xs font-semibold uppercase tracking-wider text-accent">
          {post.category} · {post.readMinutes} min
        </p>
        <h1 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">{post.publishedAt}</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground">
          <section>
            <Card className="gap-0 border border-border py-0 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-foreground">El problema</h2>
                <p className="mt-3 text-muted-foreground">{post.problem}</p>
              </CardContent>
            </Card>
          </section>
          <section>
            <Card className="gap-0 border border-border py-0 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-foreground">Impacto</h2>
                <p className="mt-3 text-muted-foreground">{post.impact}</p>
              </CardContent>
            </Card>
          </section>
          <section>
            <Card className="gap-0 border border-border py-0 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-foreground">
                  Recomendaciones
                </h2>
                <ol className="mt-4 list-decimal space-y-3 pl-5 text-muted-foreground">
                  {post.recommendations.map((rec) => (
                    <li key={rec.slice(0, 40)}>{rec}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </section>
        </div>

        <div className="mt-12">
          <Link
            href="/scan"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "inline-flex min-h-12 rounded-xl px-6 text-sm",
            )}
          >
            Ejecutar análisis pasivo →
          </Link>
        </div>

        <div className="mt-16">
          <NewsletterCTA />
        </div>
      </article>
      <SiteFooter />
    </CyberBackground>
  );
}
