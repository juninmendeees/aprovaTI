import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { auth, login, register, loading } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const fromQuery = searchParams.get("from");
  const fromState = (location.state as { from?: string } | null)?.from;
  const from = fromQuery ?? fromState ?? "/app/dashboard";
  const expired = searchParams.get("expired") === "1";

  const [mode, setMode] = useState<"login" | "register">("login");

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (auth) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "login") {
        await login(email, senha);
      } else {
        await register(nome, email, senha);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível continuar");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-ink-950">
      <header className="border-b border-slate-800/80 px-6 py-4">
        <Link to="/" className="text-lg font-semibold text-white">
          ← Aprova TI
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-2xl border border-slate-800/80 bg-ink-900/70 p-8 shadow-2xl shadow-black/40">
          <div className="mb-6 grid grid-cols-2 rounded-lg bg-ink-950 p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded-md px-3 py-2 text-sm transition ${
                mode === "login" ? "bg-sea-500 text-ink-950 font-semibold" : "text-slate-400"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`rounded-md px-3 py-2 text-sm transition ${
                mode === "register" ? "bg-sea-500 text-ink-950 font-semibold" : "text-slate-400"
              }`}
            >
              Primeiro acesso
            </button>
          </div>

          <h1 className="text-2xl font-semibold text-white">
            {mode === "login" ? "Entrar na área logada" : "Criar conta"}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {mode === "login"
              ? "Use seu e-mail e senha para gerar o token JWT."
              : "No primeiro acesso, informe nome, e-mail e senha para criar seu usuário."}
          </p>
          {expired ? (
            <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              Sua sessão expirou. Faça login novamente para continuar.
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {mode === "register" ? (
              <div>
                <label htmlFor="nome" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Nome
                </label>
                <input
                  id="nome"
                  type="text"
                  autoComplete="name"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-700 bg-ink-950 px-3 py-2.5 text-slate-100 outline-none ring-sea-500/0 transition focus:border-sea-500/50 focus:ring-2 focus:ring-sea-500/30"
                  placeholder="Seu nome"
                />
              </div>
            ) : null}

            <div>
              <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-ink-950 px-3 py-2.5 text-slate-100 outline-none ring-sea-500/0 transition focus:border-sea-500/50 focus:ring-2 focus:ring-sea-500/30"
                placeholder="voce@exemplo.com"
              />
            </div>
            <div>
              <label htmlFor="senha" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-ink-950 px-3 py-2.5 text-slate-100 outline-none ring-sea-500/0 transition focus:border-sea-500/50 focus:ring-2 focus:ring-sea-500/30"
                placeholder="••••••••"
              />
            </div>
            {error ? (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-sea-500 py-3 font-semibold text-ink-950 transition hover:bg-sea-400 disabled:opacity-60"
            >
              {loading ? "Processando…" : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
