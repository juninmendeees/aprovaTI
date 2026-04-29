import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { enviarResposta, fetchQuestaoFiltroOpcoes, fetchQuestoes } from "../api/client";
import { EnunciadoFormatado } from "../components/EnunciadoFormatado";
import type { QuestaoResponseDTO, RespostaResponseDTO } from "../types";

type FiltrosState = {
  banca: string;
  ano: string;
  disciplina: string;
  assunto: string;
  questaoId: string;
  cargoFuncao: string;
  naoRespondidas: boolean;
  somenteErrei: boolean;
  limite: string;
  ordemAleatoria: boolean;
};

const filtrosIniciais: FiltrosState = {
  banca: "",
  ano: "",
  disciplina: "",
  assunto: "",
  questaoId: "",
  cargoFuncao: "",
  naoRespondidas: false,
  somenteErrei: false,
  limite: "",
  ordemAleatoria: false,
};

export function QuestoesPage() {
  const { auth, token } = useAuth();

  const [filtros, setFiltros] = useState<FiltrosState>(filtrosIniciais);
  const [buscou, setBuscou] = useState(false);
  const [disciplinasDisponiveis, setDisciplinasDisponiveis] = useState<string[]>([]);
  const [bancasDisponiveis, setBancasDisponiveis] = useState<string[]>([]);

  const [lista, setLista] = useState<QuestaoResponseDTO[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ultima, setUltima] = useState<RespostaResponseDTO | null>(null);
  const [enviando, setEnviando] = useState(false);

  const atual = lista[idx] ?? null;

  function updateFiltro<K extends keyof FiltrosState>(key: K, value: FiltrosState[K]) {
    setFiltros((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    async function carregarOpcoes() {
      if (!token) return;
      try {
        const opcoes = await fetchQuestaoFiltroOpcoes(token);
        setDisciplinasDisponiveis(opcoes.disciplinas ?? []);
        setBancasDisponiveis(opcoes.bancas ?? []);
      } catch {
        setDisciplinasDisponiveis([]);
        setBancasDisponiveis([]);
      }
    }
    void carregarOpcoes();
  }, [token]);

  async function pesquisarQuestoes() {
    if (!auth || !token) return;
    setLoading(true);
    setError(null);
    setUltima(null);

    try {
      const questoes = await fetchQuestoes(
        {
          banca: filtros.banca || undefined,
          ano: filtros.ano ? Number(filtros.ano) : undefined,
          disciplina: filtros.disciplina || undefined,
          assunto: filtros.assunto || undefined,
          questaoId: filtros.questaoId ? Number(filtros.questaoId) : undefined,
          cargoFuncao: filtros.cargoFuncao || undefined,
          naoRespondidas: filtros.naoRespondidas || undefined,
          somenteErrei: filtros.somenteErrei || undefined,
          limite: filtros.limite ? Number(filtros.limite) : undefined,
          ordemAleatoria: filtros.ordemAleatoria || undefined,
        },
        token
      );

      setLista(questoes);
      setIdx(0);
      setBuscou(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar questões.");
    } finally {
      setLoading(false);
    }
  }

  async function responder(letra: string) {
    if (!auth || !token || !atual) return;
    setEnviando(true);
    setUltima(null);
    try {
      const r = await enviarResposta(
        {
          questaoId: atual.id,
          resposta: letra,
        },
        token
      );
      setUltima(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao enviar resposta");
    } finally {
      setEnviando(false);
    }
  }

  function proxima() {
    setUltima(null);
    if (idx + 1 < lista.length) {
      setIdx(idx + 1);
      return;
    }

    setIdx(0);
    setLista([]);
    setError(null);
  }

  function anterior() {
    setUltima(null);
    if (idx > 0) {
      setIdx(idx - 1);
    }
  }

  if (!auth) return null;

  function getAlternativaClasses(letra: string): string {
    const base =
      "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50";

    if (!ultima) {
      return `${base} border-slate-700/80 bg-ink-950/50 hover:border-sea-500/40 hover:bg-slate-800/50`;
    }

    const isCorreta = letra.toUpperCase() === (atual?.gabarito ?? "").toUpperCase();
    const isMarcada = letra.toUpperCase() === (ultima.respostaMarcada ?? "").toUpperCase();

    if (isCorreta) {
      return `${base} border-sea-500/60 bg-sea-500/15`;
    }

    if (!ultima.correta && isMarcada) {
      return `${base} border-red-500/60 bg-red-500/15`;
    }

    return `${base} border-slate-700/80 bg-ink-950/30`;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Praticar questões</h1>
      <p className="mt-1 text-slate-400">
        Defina os filtros e clique no ícone de pesquisa. Se não selecionar nenhum filtro, serão retornadas
        todas as questões.
      </p>

      <section className="mt-6 rounded-2xl border border-slate-800/80 bg-ink-900/50 p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={filtros.banca}
            onChange={(e) => updateFiltro("banca", e.target.value)}
            className="rounded-lg border border-slate-700 bg-ink-950 px-3 py-2 text-sm text-slate-100"
          >
            <option value="">Banca (todas)</option>
            {bancasDisponiveis.map((banca) => (
              <option key={banca} value={banca}>
                {banca}
              </option>
            ))}
          </select>
          <input
            value={filtros.ano}
            onChange={(e) => updateFiltro("ano", e.target.value)}
            placeholder="Ano"
            className="rounded-lg border border-slate-700 bg-ink-950 px-3 py-2 text-sm text-slate-100"
          />
          <select
            value={filtros.disciplina}
            onChange={(e) => updateFiltro("disciplina", e.target.value)}
            className="rounded-lg border border-slate-700 bg-ink-950 px-3 py-2 text-sm text-slate-100"
          >
            <option value="">Disciplina (todas)</option>
            {disciplinasDisponiveis.map((disciplina) => (
              <option key={disciplina} value={disciplina}>
                {disciplina}
              </option>
            ))}
          </select>
          <input
            value={filtros.assunto}
            onChange={(e) => updateFiltro("assunto", e.target.value)}
            placeholder="Assunto"
            className="rounded-lg border border-slate-700 bg-ink-950 px-3 py-2 text-sm text-slate-100"
          />
          <input
            value={filtros.questaoId}
            onChange={(e) => updateFiltro("questaoId", e.target.value)}
            placeholder="Número da questão (ID)"
            className="rounded-lg border border-slate-700 bg-ink-950 px-3 py-2 text-sm text-slate-100"
          />
          <input
            value={filtros.cargoFuncao}
            onChange={(e) => updateFiltro("cargoFuncao", e.target.value)}
            placeholder="Cargo/Função"
            className="rounded-lg border border-slate-700 bg-ink-950 px-3 py-2 text-sm text-slate-100"
          />
          <input
            value={filtros.limite}
            onChange={(e) => updateFiltro("limite", e.target.value)}
            placeholder="Número de questões"
            className="rounded-lg border border-slate-700 bg-ink-950 px-3 py-2 text-sm text-slate-100"
          />

          <button
            type="button"
            onClick={() => void pesquisarQuestoes()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-sea-500 px-3 py-2 text-sm font-semibold text-ink-950 transition hover:bg-sea-400 disabled:opacity-60"
            title="Pesquisar"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            {loading ? "Pesquisando..." : "Pesquisar"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-300">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={filtros.naoRespondidas}
              onChange={(e) => updateFiltro("naoRespondidas", e.target.checked)}
            />
            Não respondidas
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={filtros.somenteErrei}
              onChange={(e) => updateFiltro("somenteErrei", e.target.checked)}
            />
            Somente as que errei
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={filtros.ordemAleatoria}
              onChange={(e) => updateFiltro("ordemAleatoria", e.target.checked)}
            />
            Ordem aleatória
          </label>
        </div>
      </section>

      {!buscou ? (
        <p className="mt-8 text-slate-500">Aguardando pesquisa.</p>
      ) : loading ? (
        <p className="mt-8 text-slate-500">Carregando…</p>
      ) : error ? (
        <p className="mt-8 text-red-400">{error}</p>
      ) : lista.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-800/80 bg-ink-900/50 p-8 text-slate-400">
          Nenhuma questão encontrada para os filtros informados.
        </div>
      ) : atual ? (
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-ink-900/40 px-4 py-3 text-sm text-slate-300">
            <span>
              Questão <strong>{idx + 1}</strong> de <strong>{lista.length}</strong>
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={anterior}
                disabled={idx === 0}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs hover:border-slate-500 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setIdx((v) => (v + 1 < lista.length ? v + 1 : v))}
                disabled={idx + 1 >= lista.length}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs hover:border-slate-500 disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-slate-800 px-2 py-1 font-mono">ID {atual.id}</span>
            <span className="rounded-full bg-slate-800 px-2 py-1 font-mono">{atual.disciplina}</span>
            <span className="rounded-full bg-slate-800 px-2 py-1">{atual.banca}</span>
            <span className="rounded-full bg-slate-800 px-2 py-1">{atual.ano}</span>
            {atual.cargoFuncao ? (
              <span className="rounded-full bg-slate-800 px-2 py-1">{atual.cargoFuncao}</span>
            ) : null}
          </div>

          <article className="rounded-2xl border border-slate-800/80 bg-ink-900/60 p-6">
            <EnunciadoFormatado texto={atual.enunciado} />
            <div className="mt-6 space-y-2">
              {atual.alternativas?.map((alt) => (
                <button
                  key={alt.letra}
                  type="button"
                  disabled={enviando || !!ultima}
                  onClick={() => void responder(alt.letra)}
                  className={getAlternativaClasses(alt.letra)}
                >
                  <span className="font-mono font-semibold text-sea-400">{alt.letra}</span>
                  <span className="text-slate-300">{alt.texto}</span>
                </button>
              ))}
            </div>
          </article>

          {ultima ? (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                ultima.correta
                  ? "border-sea-500/40 bg-sea-500/10 text-sea-200"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-100"
              }`}
            >
              {ultima.correta ? "Correto." : "Incorreto."}
              <button
                type="button"
                onClick={proxima}
                className="ml-3 font-semibold text-white underline decoration-sea-400 underline-offset-2 hover:text-sea-300"
              >
                Próxima
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
