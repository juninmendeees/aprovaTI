import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { PublicSiteHeader } from "../components/PublicSiteHeader";
import { getPostBySlug } from "../blog/posts";

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "long",
    }).format(new Date(iso + "T12:00:00"));
  } catch {
    return iso;
  }
}

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPostBySlug(slug) : undefined;

  useEffect(() => {
    if (post) document.title = `${post.title} · Blog · Aprova TI`;
    else if (slug) document.title = "Artigo não encontrado · Aprova TI";
    else document.title = "Blog · Aprova TI";
    return () => {
      document.title = "Aprova TI";
    };
  }, [post, slug]);

  if (!post) {
    return (
      <div className="min-h-screen bg-ink-950 text-slate-200">
        <PublicSiteHeader />
        <main className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="text-2xl font-semibold text-white">Artigo não encontrado</h1>
          <p className="mt-3 text-slate-400">Esse endereço não corresponde a nenhum post publicado.</p>
          <Link to="/blog" className="mt-6 inline-block text-sea-400 hover:text-sea-300">
            ← Voltar ao blog
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950 text-slate-200">
      <PublicSiteHeader />

      <article className="mx-auto max-w-3xl px-6 py-14">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {formatDate(post.publishedAt)}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">{post.title}</h1>
        <p className="mt-4 text-lg text-slate-400">{post.description}</p>

        <div
          className="prose-blog mt-12 text-slate-300 [&_a]:text-sea-400 [&_a]:underline hover:[&_a]:text-sea-300 [&_code]:rounded [&_code]:bg-slate-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:text-sea-200 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white [&_hr]:my-10 [&_hr]:border-slate-700 [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_p]:leading-relaxed [&_strong]:font-semibold [&_strong]:text-white [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6"
        >
          <ReactMarkdown>{post.body}</ReactMarkdown>
        </div>

        <footer className="mt-16 border-t border-slate-800 pt-8">
          <Link to="/blog" className="text-sm font-medium text-sea-400 hover:text-sea-300">
            ← Todos os artigos
          </Link>
        </footer>
      </article>
    </div>
  );
}
