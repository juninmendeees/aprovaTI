import { useEffect, useMemo, useState } from "react";
import { fetchMapasMentais, fetchMapasMentaisDisciplinas } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { MapaMentalDTO } from "../types";

export function MapasMentaisPage() {
  const { token } = useAuth();
  const [mapas, setMapas] = useState<MapaMentalDTO[]>([]);
  const [disciplinas, setDisciplinas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerTitle, setViewerTitle] = useState("");
  const [viewerMaps, setViewerMaps] = useState<MapaMentalDTO[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);

  async function carregar() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [disciplinasData, mapasData] = await Promise.all([
        fetchMapasMentaisDisciplinas(token),
        fetchMapasMentais(token),
      ]);
      setDisciplinas(disciplinasData);
      setMapas(mapasData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar mapas mentais.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, [token]);

  function abrirDisciplina(disciplina: string) {
    const filtered = disciplina === "TODOS" ? mapas : mapas.filter((m) => m.disciplina === disciplina);
    setViewerMaps(filtered);
    setViewerIndex(0);
    setViewerTitle(disciplina === "TODOS" ? "Todos os mapas mentais" : `Disciplina: ${disciplina}`);
    setViewerOpen(true);
  }

  const mapaAtual = useMemo(() => {
    if (!viewerOpen || viewerMaps.length === 0) return null;
    return viewerMaps[viewerIndex] ?? null;
  }, [viewerOpen, viewerMaps, viewerIndex]);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-800/80 bg-ink-900/60 p-6">
        <h1 className="text-2xl font-semibold text-white">Mapas Mentais</h1>
        <p className="mt-2 text-sm text-slate-400">
          Selecione a disciplina para visualizar os mapas mentais cadastrados.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-ink-950/60 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total de mapas</p>
            <p className="mt-1 text-xl font-semibold text-white">{mapas.length}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-ink-950/60 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Disciplinas</p>
            <p className="mt-1 text-xl font-semibold text-white">{disciplinas.length}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-ink-950/60 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Atualização</p>
            <button
              type="button"
              onClick={() => void carregar()}
              className="mt-2 rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
            >
              Atualizar
            </button>
          </div>
        </div>
      </header>

      {error ? <p className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-500">Carregando mapas mentais...</p> : null}

      <section className="space-y-3 rounded-2xl border border-slate-800/80 bg-ink-900/50 p-4">
        <p className="text-sm font-semibold text-white">Disciplinas</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {["TODOS", ...disciplinas].map((disciplina) => {
            const total = disciplina === "TODOS" ? mapas.length : mapas.filter((m) => m.disciplina === disciplina).length;
            return (
              <button
                key={disciplina}
                type="button"
                onClick={() => abrirDisciplina(disciplina)}
                className="h-24 rounded-xl border border-slate-700 bg-ink-950/70 px-4 py-3 text-left transition hover:border-sea-500/40 hover:bg-sea-500/5"
              >
                <p className="truncate text-sm font-semibold text-slate-100">
                  {disciplina === "TODOS" ? "Todos" : disciplina}
                </p>
                <p className="mt-1 text-xs text-slate-400">{total} mapa(s)</p>
              </button>
            );
          })}
        </div>
      </section>

      {viewerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-5xl rounded-2xl border border-slate-700 bg-ink-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">{viewerTitle}</p>
                <p className="text-sm text-slate-300">
                  {viewerMaps.length === 0 ? "Sem mapas" : `Mapa ${viewerIndex + 1} de ${viewerMaps.length}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewerOpen(false)}
                className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
              >
                Fechar
              </button>
            </div>
            <div className="space-y-4 p-4">
              {!mapaAtual ? (
                <p className="text-sm text-slate-400">Nenhum mapa mental nesta seleção.</p>
              ) : (
                <>
                  <div className="rounded-xl border border-slate-800 bg-ink-900/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{mapaAtual.disciplina}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-100">{mapaAtual.assunto}</p>
                    <p className="mt-1 text-xs text-slate-400">{mapaAtual.titulo}</p>
                    {mapaAtual.imagemDataUrl ? (
                      <img
                        src={mapaAtual.imagemDataUrl}
                        alt={`Mapa mental - ${mapaAtual.titulo}`}
                        className="mt-4 max-h-[65vh] w-full rounded-lg border border-slate-800 object-contain bg-ink-950"
                      />
                    ) : null}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewerIndex((v) => Math.max(v - 1, 0))}
                      disabled={viewerIndex === 0}
                      className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewerIndex((v) => Math.min(v + 1, Math.max(viewerMaps.length - 1, 0)))}
                      disabled={viewerIndex >= viewerMaps.length - 1}
                      className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                    >
                      Próximo
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
