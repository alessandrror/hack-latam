import Image from "next/image";
import Link from "next/link";

import type { BlogPost } from "@/data/blog-posts";
import { formatBlogDate } from "@/lib/blog-utils";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BlogPostCardProps = {
  post: BlogPost;
  variant?: "default" | "compact";
  className?: string;
};

export function BlogPostCard({
  post,
  variant = "default",
  className,
}: BlogPostCardProps) {
  const isCompact = variant === "compact";

  return (
    <Link href={`/blog/${post.slug}`} className={cn("group block h-full", className)}>
      <Card
        className={cn(
          "h-full gap-0 overflow-hidden border border-border py-0 shadow-sm transition duration-300",
          "hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg",
        )}
      >
        <div
          className={cn(
            "relative w-full overflow-hidden bg-muted",
            isCompact ? "h-36" : "h-48",
          )}
        >
          <Image
            src={post.coverImage}
            alt={post.coverImageAlt}
            fill
            sizes={
              isCompact
                ? "(max-width: 768px) 100vw, 33vw"
                : "(max-width: 768px) 100vw, 400px"
            }
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
        <CardContent className={cn("flex flex-col", isCompact ? "p-4" : "p-5")}>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider text-accent">
              {post.category}
            </span>
            <span aria-hidden>·</span>
            <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time>
            <span aria-hidden>·</span>
            <span>{post.readMinutes} min</span>
          </div>
          <h2
            className={cn(
              "mt-3 font-semibold text-foreground transition-colors group-hover:text-accent",
              isCompact ? "text-base leading-snug" : "text-lg leading-snug",
            )}
          >
            {post.title}
          </h2>
          <p
            className={cn(
              "mt-2 line-clamp-3 text-muted-foreground",
              isCompact ? "text-xs leading-relaxed" : "text-sm leading-relaxed",
            )}
          >
            {post.excerpt}
          </p>
          {!isCompact && post.tags.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {post.tags.slice(0, 3).map((tag) => (
                <li
                  key={tag}
                  className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}
          <span className="mt-4 text-sm font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
            Leer artículo →
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
