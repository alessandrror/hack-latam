import type { BlogPost } from "@/data/blog-posts";
import { BlogPostCard } from "@/components/blog/BlogPostCard";

type RelatedPostsProps = {
  posts: BlogPost[];
};

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-20 border-t border-border pt-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        Sigue leyendo
      </p>
      <h2 className="mt-2 text-2xl font-bold text-foreground">Artículos relacionados</h2>
      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <li key={post.slug}>
            <BlogPostCard post={post} variant="compact" />
          </li>
        ))}
      </ul>
    </section>
  );
}
