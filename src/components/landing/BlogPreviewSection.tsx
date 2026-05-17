import Link from "next/link";

import { BLOG_POSTS } from "@/data/blog-posts";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BlogPreviewSection() {
  const preview = BLOG_POSTS.slice(0, 3);

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-foreground/80">
            Blog
          </p>
          <h2 className="mt-3 text-3xl font-bold text-foreground">
            Fallos típicos y cómo mitigarlos
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Guías cortas ligadas a señales que ya son visibles públicamente cuando
            miras huella DNS y HTTPS.
          </p>
        </div>
        <Link
          href="/blog"
          className={cn(
            buttonVariants({ variant: "link", size: "sm" }),
            "font-medium text-accent",
          )}
        >
          Ver todos los artículos →
        </Link>
      </div>
      <ul className="mt-10 grid gap-5 md:grid-cols-3">
        {preview.map((post) => (
          <li key={post.slug} className="h-full">
            <Link href={`/blog/${post.slug}`} className="block h-full">
              <Card
                className={cn(
                  "h-full gap-0 border border-border py-0 shadow-sm transition hover:shadow-md",
                )}
              >
                <CardContent className="flex h-full flex-col p-5">
                  <span className="text-xs font-bold uppercase tracking-wide text-foreground/85">
                    {post.category}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-foreground">
                    {post.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>
                  <p className="mt-4 text-xs text-foreground/60">
                    {post.readMinutes} min lectura
                  </p>
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
