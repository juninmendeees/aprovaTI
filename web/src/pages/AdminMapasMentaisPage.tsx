import { useEffect, useState } from "react";
import {
  adminAtualizarMapaMental,
  adminCriarMapaMental,
  adminListarMapasMentais,
  adminRemoverMapaMental,
  fetchMapasMentaisDisciplinas,
} from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { MapaMentalDTO } from "../types";

export function AdminMapasMentaisPage() {
  const { token } = useAuth();
  const [mapas, setMapas] = useState<MapaMentalDTO[]>([]);
  const [disciplinas, setDisciplinas] = useState<string[]>([]);
  const [disciplinaFiltro, setDisciplinaFiltro] = useState("");
  const [assuntoFiltro, setAssuntoFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [disciplina, setDisciplina] = useState("");
  const [assunto, setAssunto] = useState("");
  const [titulo, setTitulo] = useState("");
  const [imagem, setImagem] = useState<File | null>(null);

  async function carregar() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [disciplinasData, mapasData] = await Promise.all([
        fetchMapasMentaisDisciplinas(token),
        adminListarMapasMentais(token, {
          disciplina: disciplinaFiltro || undefined,
          assunto: assuntoFiltro || undefined,
        }),
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
  }, [token, disciplinaFiltro, assuntoFiltro]);

  async function criar() {
    if (!token || !imagem) return;
    setError(null);
    setStatus(null);
    try {
      await adminCriarMapaMental(token, { disciplina, assunto, titulo, imagem });
      setStatus("Mapa mental criado.");
      setDisciplina("");
      setAssunto("");
      setTitulo("");
      setImagem(null);
      await carregar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao criar mapa mental.");
    }
  }

  async function editar(mapa: MapaMentalDTO) {
    if (!token) return;
    const nextDisciplina = window.prompt("Disciplina", mapa.disciplina);
    if (!nextDisciplina) return;
    const nextAssunto = window.prompt("Assunto", mapa.assunto);
    if (!nextAssunto) return;
    const nextTitulo = window.prompt("Título", mapa.titulo);
    if (!nextTitulo) return;
    setError(null);
    try {
      await adminAtualizarMapaMental(token, mapa.id, {
        disciplina: nextDisciplina,
        assunto: nextAssunto,
        titulo: nextTitulo,
      });
      setStatus("Mapa mental atualizado.");
      await carregar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao atualizar mapa mental.");
    }
  }

  async function remover(mapa: MapaMentalDTO) {
    if (!token) return;
    if (!window.confirm(`Remover mapa mental "${mapa.titulo}"?`)) return;
    setError(null);
    try {
      await adminRemoverMapaMental(token, mapa.id);
      setStatus("Mapa mental removido.");
      await carregar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao remover mapa mental.");
    }
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-800/80 bg-ink-900/60 p-6">
        <h1 className="text-2xl font-semibold text-white">Admin Mapas Mentais</h1>
        <p className="mt-2 text-sm text-slate-400">
          Cadastre mapas mentais por disciplina e assunto para exibição global no sistema.
        </p>
      </header>

      {error ? <p className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p> : null}
      {status ? <p className="rounded border border-sea-500/30 bg-sea-500/10 px-3 py-2 text-sm text-sea-200">{status}</p> : null}

      <section className="space-y-3 rounded-2xl border border-slate-800/80 bg-ink-900/50 p-4">
        <h2 className="text-sm font-semibold text-white">Novo mapa mental</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={disciplina}
            onChange={(e) => setDisciplina(e.target.value)}
            placeholder="Disciplina"
            className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100"
            list="disciplinas-mapas-admin"
          />
          <input
            value={assunto}
            onChange={(e) => setAssunto(e.target.value)}
            placeholder="Assunto"
            className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100"
          />
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título do mapa"
            className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100 md:col-span-2"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImagem(e.target.files?.[0] ?? null)}
            className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100 md:col-span-2"
          />
        </div>
        <button
          type="button"
          onClick={() => void criar()}
          disabled={!imagem}
          className="rounded bg-sea-500 px-3 py-2 text-sm font-semibold text-ink-950 disabled:opacity-60"
        >
          Criar mapa
        </button>
        <datalist id="disciplinas-mapas-admin">
          {disciplinas.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-800/80 bg-ink-900/50 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <p className="text-xs text-slate-500">Filtro disciplina</p>
            <select
              value={disciplinaFiltro}
              onChange={(e) => setDisciplinaFiltro(e.target.value)}
              className="w-full rounded border border-slate-700 bg-ink-950 px-3 py-2 text-sm text-slate-100"
            >
              <option value="">Todas</option>
              {disciplinas.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <p className="text-xs text-slate-500">Filtro assunto</p>
            <input
              value={assuntoFiltro}
              onChange={(e) => setAssuntoFiltro(e.target.value)}
              placeholder="Buscar por assunto..."
              className="w-full rounded border border-slate-700 bg-ink-950 px-3 py-2 text-sm text-slate-100"
            />
          </div>
        </div>
        {loading ? <p className="text-slate-500">Carregando...</p> : null}
        {!loading && mapas.length === 0 ? <p className="text-sm text-slate-500">Nenhum mapa mental cadastrado.</p> : null}
        <div className="grid gap-3 md:grid-cols-2">
          {mapas.map((mapa) => (
            <div key={mapa.id} className="rounded-lg border border-slate-800 bg-ink-950/40 p-3">
              <p className="text-xs text-slate-500">
                {mapa.disciplina} • {mapa.assunto}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-100">{mapa.titulo}</p>
              {mapa.imagemDataUrl ? (
                <img
                  src={mapa.imagemDataUrl}
                  alt={mapa.titulo}
                  className="mt-2 h-40 w-full rounded border border-slate-800 object-contain bg-ink-950"
                />
              ) : null}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => void editar(mapa)}
                  className="rounded border border-slate-700 px-2 py-1 text-xs text-sea-200 hover:bg-slate-800"
                >
                  editar
                </button>
                <button
                  type="button"
                  onClick={() => void remover(mapa)}
                  className="rounded border border-slate-700 px-2 py-1 text-xs text-red-200 hover:bg-slate-800"
                >
                  remover
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
