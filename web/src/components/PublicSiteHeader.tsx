import { Link } from "react-router-dom";

type PublicSiteHeaderProps = {
  /** Na home, âncoras #sobre / #planos; em outras páginas omitir. */
  landingAnchors?: boolean;
};

export function PublicSiteHeader({ landingAnchors }: PublicSiteHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-ink-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-lg font-semibold tracking-tight text-white">
          Aprova TI
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 text-sm">
          {landingAnchors ? (
            <>
              <a href="#sobre" className="text-slate-400 hover:text-white">
                Plataforma
              </a>
              <a href="#planos" className="text-slate-400 hover:text-white">
                Planos
              </a>
            </>
          ) : null}
          <Link to="/blog" className="text-slate-400 hover:text-white">
            Blog
          </Link>
          <Link to="/politicas" className="text-slate-400 hover:text-white">
            Políticas
          </Link>
          <Link
            to="/login"
            className="rounded-lg bg-sea-500 px-4 py-2 font-medium text-ink-950 transition hover:bg-sea-400"
          >
            Entrar
          </Link>
        </nav>
      </div>
    </header>
  );
}
