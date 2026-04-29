import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PublicSiteHeader } from "../components/PublicSiteHeader";
import { BLOG_POSTS } from "../blog/posts";

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "medium",
    }).format(new Date(iso + "T12:00:00"));
  } catch {
    return iso;
  }
}

export function BlogListPage() {
  useEffect(() => {
    document.title = "Blog · Aprova TI";
    return () => {
      document.title = "Aprova TI";
    };
  }, []);

  const sorted = [...BLOG_POSTS].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  return (
    <div className="min-h-screen bg-ink-950 text-slate-200">
      <PublicSiteHeader />

      <main className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Blog</h1>
        <p className="mt-3 text-slate-400">
          Artigos para quem estuda concursos de TI com método e constância.
        </p>

        <ul className="mt-12 space-y-10">
          {sorted.map((post) => (
            <li key={post.slug} className="border-b border-slate-800/80 pb-10 last:border-0">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {formatDate(post.publishedAt)}
              </p>
              <Link
                to={`/blog/${post.slug}`}
                className="mt-2 block text-xl font-semibold text-white hover:text-sea-300"
              >
                {post.title}
              </Link>
              <p className="mt-2 text-slate-400">{post.description}</p>
              <Link
                to={`/blog/${post.slug}`}
                className="mt-3 inline-block text-sm font-medium text-sea-400 hover:text-sea-300"
              >
                Ler artigo →
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
