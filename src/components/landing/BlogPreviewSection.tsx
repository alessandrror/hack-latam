import Link from "next/link";

import { BLOG_POSTS } from "@/data/blog-posts";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { buttonVariants } from "@/components/ui/button";
import { getSortedPosts } from "@/lib/blog-utils";
import { cn } from "@/lib/utils";

export function BlogPreviewSection() {
  const preview = getSortedPosts(BLOG_POSTS).slice(0, 3);

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-foreground/80">
            Centro de práctica
          </p>
          <h2 className="mt-3 text-3xl font-bold text-foreground">
            Qué hacer con lo que ya es público
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {BLOG_POSTS.length} artículos sobre errores repetidos SPF/DMARC, HTTPS y
            huella observable: mismo lenguaje directo que en el instantáneo de escaneo.
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
      <ul className="mt-10 grid gap-6 md:grid-cols-3">
        {preview.map((post) => (
          <li key={post.slug} className="h-full">
            <BlogPostCard post={post} />
          </li>
        ))}
      </ul>
    </section>
  );
}
