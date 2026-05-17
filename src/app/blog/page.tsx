import { BLOG_POSTS } from "@/data/blog-posts";
import { BlogFeaturedPost } from "@/components/blog/BlogFeaturedPost";
import { BlogPostGrid } from "@/components/blog/BlogPostGrid";
import { NewsletterCTA } from "@/components/ui/NewsletterCTA";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { getFeaturedPost, getSortedPosts } from "@/lib/blog-utils";

export const metadata = {
  title: "Blog — Hack LATAM",
  description:
    "Guías prácticas sobre SPF, DMARC, HTTPS, superficie de ataque y postura defensiva para PYMEs en Latinoamérica.",
};

export default function BlogPage() {
  const sorted = getSortedPosts(BLOG_POSTS);
  const featured = getFeaturedPost(BLOG_POSTS);
  const rest = featured
    ? sorted.filter((p) => p.slug !== featured.slug)
    : sorted;

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-border">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(2,132,199,0.18),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Centro de conocimiento
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Blog de ciberseguridad
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {BLOG_POSTS.length} guías sobre señales públicas — DNS, correo, TLS y
            superficie de ataque — con acciones concretas para equipos que no tienen
            SOC dedicado.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        {featured && (
          <div className="mb-16">
            <BlogFeaturedPost post={featured} />
          </div>
        )}

        <BlogPostGrid posts={rest} />

        <div className="mt-20">
          <NewsletterCTA />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
