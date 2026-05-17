import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BLOG_POSTS, getPostBySlug } from "@/data/blog-posts";
import { BlogArticleSections } from "@/components/blog/BlogArticleSections";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { NewsletterCTA } from "@/components/ui/NewsletterCTA";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { buttonVariants } from "@/components/ui/button";
import { formatBlogDate, getRelatedPosts } from "@/lib/blog-utils";
import { cn } from "@/lib/utils";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Art\u00edculo no encontrado" };
  return {
    title: `${post.title} | Hack LATAM`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      images: [{ url: post.coverImage, alt: post.coverImageAlt }],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const related = getRelatedPosts(post, BLOG_POSTS);

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <div className="relative -mt-px aspect-[21/9] min-h-[200px] overflow-hidden rounded-b-2xl sm:min-h-[280px]">
          <Image
            src={post.coverImage}
            alt={post.coverImageAlt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>

        <article className="relative -mt-24 pb-16 sm:-mt-32">
          <div className="mx-auto max-w-3xl">
            <Link
              href="/blog"
              className="inline-flex text-sm text-muted-foreground transition hover:text-accent"
            >
              &larr; Volver al blog
            </Link>

            <header className="mt-8">
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span className="rounded-full bg-accent/15 px-3 py-1 text-accent">
                  {post.category}
                </span>
                <span>{post.readMinutes} min de lectura</span>
                <span aria-hidden>&middot;</span>
                <time dateTime={post.publishedAt}>
                  {formatBlogDate(post.publishedAt)}
                </time>
              </div>

              <h1 className="mt-5 text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
                {post.title}
              </h1>

              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                {post.excerpt}
              </p>

              <p className="mt-6 text-sm text-muted-foreground">
                Por{" "}
                <span className="font-medium text-foreground">{post.author}</span>
              </p>

              {post.tags.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground"
                    >
                      #{tag}
                    </li>
                  ))}
                </ul>
              )}
            </header>

            <div className="mt-12">
              <BlogArticleSections post={post} />
            </div>

            <div className="mt-12 rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-foreground">
                Valida tu postura en minutos
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Ejecuta un an\u00e1lisis pasivo sobre tu dominio y contrasta estos hallazgos
                con tu configuraci\u00f3n real.
              </p>
              <Link
                href="/scan"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "mt-5 inline-flex min-h-12 rounded-xl px-6 text-sm",
                )}
              >
                Ejecutar an\u00e1lisis pasivo &rarr;
              </Link>
            </div>

            <RelatedPosts posts={related} />

            <div className="mt-16">
              <NewsletterCTA />
            </div>
          </div>
        </article>
      </div>

      <SiteFooter />
    </div>
  );
}