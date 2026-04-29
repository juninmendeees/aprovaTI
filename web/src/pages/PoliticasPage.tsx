import { useEffect, useState } from "react";
import { PublicSiteHeader } from "../components/PublicSiteHeader";
import { fetchPoliticasPublicas } from "../api/client";
import type { PoliticasResponse } from "../types";

export function PoliticasPage() {
  const [data, setData] = useState<PoliticasResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchPoliticasPublicas();
        setData(res);
      } catch {
        setError("Não foi possível carregar as políticas no momento.");
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-ink-950 text-slate-200">
      <PublicSiteHeader />

      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-semibold text-white">Políticas da Plataforma</h1>
        <p className="mt-2 text-slate-400">
          Transparência sobre retenção de dados, segurança e práticas operacionais.
        </p>

        {error ? (
          <p className="mt-8 text-red-300">{error}</p>
        ) : !data ? (
          <p className="mt-8 text-slate-500">Carregando políticas...</p>
        ) : (
          <div className="mt-8 space-y-6">
            <section className="rounded-2xl border border-slate-800/80 bg-ink-900/50 p-6">
              <h2 className="text-xl font-semibold text-white">Base legal</h2>
              <p className="mt-2 text-slate-300">{data.baseLegal}</p>
            </section>

            <section className="rounded-2xl border border-slate-800/80 bg-ink-900/50 p-6">
              <h2 className="text-xl font-semibold text-white">Política de retenção</h2>
              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <p>
                  <strong>Auditoria administrativa:</strong> {data.retencao.auditoriaDias} dias.
                </p>
                <p>
                  <strong>Logs de aplicação:</strong> {data.retencao.logsAplicacaoDias} dias.
                </p>
                <p>
                  <strong>Dados de estudo:</strong> {data.retencao.dadosEstudo}.
                </p>
                <p>
                  <strong>Prazo para exclusão solicitada:</strong>{" "}
                  {data.retencao.exclusaoSolicitadaDias} dias.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800/80 bg-ink-900/50 p-6">
              <h2 className="text-xl font-semibold text-white">Práticas adotadas</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-300">
                {data.praticas.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
