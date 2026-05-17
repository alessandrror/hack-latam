import type { BlogCategory, BlogPost } from "@/data/blog-posts";

export function getSortedPosts(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function getFeaturedPost(posts: BlogPost[]): BlogPost | undefined {
  return posts.find((p) => p.featured) ?? getSortedPosts(posts)[0];
}

export function getRelatedPosts(
  post: BlogPost,
  posts: BlogPost[],
  limit = 3,
): BlogPost[] {
  return getSortedPosts(posts)
    .filter((p) => p.slug !== post.slug)
    .sort((a, b) => {
      const sameCategory = (p: BlogPost) => (p.category === post.category ? 1 : 0);
      return sameCategory(b) - sameCategory(a);
    })
    .slice(0, limit);
}

export function getAllCategories(posts: BlogPost[]): BlogCategory[] {
  return [...new Set(posts.map((p) => p.category))].sort();
}

export function formatBlogDate(isoDate: string): string {
  return new Intl.DateTimeFormat("es-LA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(isoDate));
}
