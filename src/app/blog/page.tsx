import Link from "next/link";
import { BLOG_POSTS } from "@/data/blog-posts";
import { CyberBackground } from "@/components/ui/CyberBackground";
import { NewsletterCTA } from "@/components/ui/NewsletterCTA";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Blog — Hack LATAM",
  description:
    "Patrones típicos en escaneos pasivos defensivos y pasos prácticos para PYMEs (sin jargon innecesario).",
};

export default function BlogPage() {
  return (
    <CyberBackground>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Centro de conocimiento
        </p>
        <h1 className="mt-3 text-4xl font-bold text-foreground">
          Blog de ciberseguridad
        </h1>
        <p className="mt-4 text-muted-foreground">
          Señales que suelen aparecer cuando miras huella DNS y HTTPS en público —
          qué significan y qué hacer después.
        </p>
        <ul className="mt-12 space-y-6">
          {BLOG_POSTS.map((post) => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="block">
                <Card className="gap-0 border border-border py-0 shadow-sm transition hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-semibold uppercase tracking-wider text-accent">
                        {post.category}
                      </span>
                      <span>{post.publishedAt}</span>
                      <span>{post.readMinutes} min</span>
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-foreground">
                      {post.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {post.excerpt}
                    </p>
                    <span className="mt-4 inline-block text-sm font-medium text-accent">
                      Leer artículo →
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-16">
          <NewsletterCTA />
        </div>
      </main>
      <SiteFooter />
    </CyberBackground>
  );
}
