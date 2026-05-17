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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-400">
            Blog
          </p>
          <h2 className="mt-3 text-3xl font-bold text-white">
            Fallos típicos y cómo mitigarlos
          </h2>
          <p className="mt-2 max-w-xl text-sm text-slate-400">
            Guías breves sobre los hallazgos que más vemos en escaneos pasivos.
          </p>
        </div>
        <Link
          href="/blog"
          className={cn(
            buttonVariants({ variant: "link", size: "sm" }),
            "font-medium text-cyan-400 hover:text-cyan-300 dark:text-cyan-400 dark:hover:text-cyan-300",
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
                  "neon-panel h-full gap-0 py-0 shadow-none ring-0 transition hover:border-cyan-400/35 dark:hover:bg-transparent",
                )}
              >
                <CardContent className="flex h-full flex-col p-5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400/90">
                    {post.category}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-white">
                    {post.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">
                    {post.excerpt}
                  </p>
                  <p className="mt-4 text-xs text-slate-500">
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
