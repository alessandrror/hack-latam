"use client";

import { useMemo, useState } from "react";

import type { BlogCategory, BlogPost } from "@/data/blog-posts";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { getAllCategories } from "@/lib/blog-utils";
import { cn } from "@/lib/utils";

type BlogPostGridProps = {
  posts: BlogPost[];
};

export function BlogPostGrid({ posts }: BlogPostGridProps) {
  const categories = useMemo(() => getAllCategories(posts), [posts]);
  const [activeCategory, setActiveCategory] = useState<BlogCategory | "all">("all");

  const filtered =
    activeCategory === "all"
      ? posts
      : posts.filter((p) => p.category === activeCategory);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <CategoryPill
          label="Todos"
          active={activeCategory === "all"}
          onClick={() => setActiveCategory("all")}
        />
        {categories.map((category) => (
          <CategoryPill
            key={category}
            label={category}
            active={activeCategory === category}
            onClick={() => setActiveCategory(category)}
          />
        ))}
      </div>

      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((post) => (
          <li key={post.slug}>
            <BlogPostCard post={post} />
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <p className="mt-12 text-center text-muted-foreground">
          No hay artículos en esta categoría.
        </p>
      )}
    </div>
  );
}

function CategoryPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-1.5 text-xs font-medium transition",
        active
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border bg-card text-muted-foreground hover:border-accent/50 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
