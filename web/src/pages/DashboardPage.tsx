import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchDashboard } from "../api/client";
import type { DashboardResponse } from "../types";

function formatDisciplinaLabel(raw: string) {
  return raw.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function DashboardPage() {
  const { auth, token } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const d = await fetchDashboard(token);
        if (!cancelled) setData(d);
      } catch {
        if (!cancelled) setError("Não foi possível carregar o desempenho.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auth, token]);

  if (!auth) return null;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">
        Olá, {auth.nome?.split(" ")[0] ?? "estudante"}
      </h1>
      <p className="mt-1 text-slate-400">Visão geral das suas resoluções de questões.</p>

      {loading ? (
        <p className="mt-10 text-slate-500">Carregando métricas…</p>
      ) : error ? (
        <p className="mt-10 text-red-400">{error}</p>
      ) : data ? (
        <>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800/80 bg-ink-900/60 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total</p>
              <p className="mt-1 text-3xl font-bold text-white">{data.total}</p>
              <p className="text-sm text-slate-500">questões respondidas</p>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-ink-900/60 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Acertos</p>
              <p className="mt-1 text-3xl font-bold text-sea-400">{data.acertos}</p>
              <p className="text-sm text-slate-500">respostas corretas</p>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-ink-900/60 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Aproveitamento</p>
              <p className="mt-1 text-3xl font-bold text-white">
                {data.percentual.toFixed(1)}
                <span className="text-lg text-slate-500">%</span>
              </p>
              <p className="text-sm text-slate-500">média geral</p>
            </div>
          </div>

          <h2 className="mt-14 text-lg font-semibold text-white">Por disciplina</h2>
          <p className="text-sm text-slate-500">Percentual de acerto em cada área respondida.</p>

          <div className="mt-6 space-y-4">
            {data.disciplinas.length === 0 ? (
              <p className="text-slate-500">
                Ainda não há respostas registradas.{" "}
                <Link to="/app/questoes" className="text-sea-400 hover:underline">
                  Praticar questões
                </Link>
              </p>
            ) : (
              data.disciplinas.map((d) => (
                <div
                  key={d.disciplina}
                  className="rounded-xl border border-slate-800/80 bg-ink-900/50 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-slate-200">{formatDisciplinaLabel(d.disciplina)}</span>
                    <span className="font-mono text-sm text-sea-400">
                      {d.percentual.toFixed(1)}% · {d.acertos}/{d.total}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sea-600 to-sea-400 transition-all"
                      style={{ width: `${Math.min(100, d.percentual)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
