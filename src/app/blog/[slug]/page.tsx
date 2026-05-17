import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_POSTS, getPostBySlug } from "@/data/blog-posts";
import { CyberBackground } from "@/components/ui/CyberBackground";
import { NewsletterCTA } from "@/components/ui/NewsletterCTA";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Artículo no encontrado" };
  return {
    title: `${post.title} — Hack LATAM`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <CyberBackground>
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <Link
          href="/blog"
          className="text-sm text-slate-500 hover:text-cyan-300"
        >
          ← Blog
        </Link>
        <p className="mt-8 text-xs font-semibold uppercase tracking-wider text-cyan-400">
          {post.category} · {post.readMinutes} min
        </p>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-4 text-sm text-slate-500">{post.publishedAt}</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-slate-300">
          <section className="neon-panel p-6">
            <h2 className="text-lg font-semibold text-white">El problema</h2>
            <p className="mt-3">{post.problem}</p>
          </section>
          <section className="neon-panel p-6">
            <h2 className="text-lg font-semibold text-white">Impacto</h2>
            <p className="mt-3">{post.impact}</p>
          </section>
          <section className="neon-panel p-6">
            <h2 className="text-lg font-semibold text-white">
              Recomendaciones
            </h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5">
              {post.recommendations.map((rec) => (
                <li key={rec.slice(0, 40)}>{rec}</li>
              ))}
            </ol>
          </section>
        </div>

        <div className="mt-12">
          <Link
            href="/scan"
            className="inline-flex min-h-12 items-center rounded-xl btn-gradient-neon px-6 text-sm"
          >
            Probar con un escaneo →
          </Link>
        </div>

        <div className="mt-16">
          <NewsletterCTA />
        </div>
      </article>
      <SiteFooter />
    </CyberBackground>
  );
}
