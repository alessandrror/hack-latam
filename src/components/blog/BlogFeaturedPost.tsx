import Image from "next/image";
import Link from "next/link";

import type { BlogPost } from "@/data/blog-posts";
import { formatBlogDate } from "@/lib/blog-utils";
import { cn } from "@/lib/utils";

type BlogFeaturedPostProps = {
  post: BlogPost;
  className?: string;
};

export function BlogFeaturedPost({ post, className }: BlogFeaturedPostProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group relative block overflow-hidden rounded-2xl border border-border bg-card shadow-md transition duration-300 hover:border-accent/50 hover:shadow-xl",
        className,
      )}
    >
      <div className="grid md:grid-cols-2">
        <div className="relative aspect-[16/10] min-h-[220px] md:aspect-auto md:min-h-[320px]">
          <Image
            src={post.coverImage}
            alt={post.coverImageAlt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-background/20" />
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-8 md:p-10">
          <span className="inline-flex w-fit rounded-full bg-accent/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
            Destacado
          </span>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {post.category} · {post.readMinutes} min ·{" "}
            <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time>
          </p>
          <h2 className="mt-3 text-2xl font-bold leading-tight text-foreground transition-colors group-hover:text-accent sm:text-3xl">
            {post.title}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {post.excerpt}
          </p>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent">
            Leer artículo completo
            <span aria-hidden className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
