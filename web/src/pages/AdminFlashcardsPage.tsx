import { useEffect, useState } from "react";
import {
  adminAtualizarFlashcardPadrao,
  adminListarFlashcardsPadrao,
  adminRemoverFlashcardPadrao,
  criarFlashcardPadraoAdmin,
  fetchFlashcardsDisciplinas,
} from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { FlashcardDTO } from "../types";

export function AdminFlashcardsPage() {
  const { token } = useAuth();
  const [cards, setCards] = useState<FlashcardDTO[]>([]);
  const [disciplinas, setDisciplinas] = useState<string[]>([]);
  const [disciplinaFiltro, setDisciplinaFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [disciplina, setDisciplina] = useState("");
  const [frente, setFrente] = useState("");
  const [verso, setVerso] = useState("");
  const [imagem, setImagem] = useState<File | null>(null);

  async function carregar() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [disciplinasData, cardsData] = await Promise.all([
        fetchFlashcardsDisciplinas(token),
        adminListarFlashcardsPadrao(token, { disciplina: disciplinaFiltro || undefined }),
      ]);
      setDisciplinas(disciplinasData);
      setCards(cardsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar flashcards globais.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, [token, disciplinaFiltro]);

  async function criar() {
    if (!token) return;
    setError(null);
    setStatus(null);
    try {
      await criarFlashcardPadraoAdmin(token, { disciplina, frente, verso, imagem });
      setStatus("Flashcard global criado.");
      setDisciplina("");
      setFrente("");
      setVerso("");
      setImagem(null);
      await carregar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao criar flashcard.");
    }
  }

  async function editar(card: FlashcardDTO) {
    if (!token) return;
    const nextDisc = window.prompt("Disciplina", card.disciplina);
    if (!nextDisc) return;
    const nextFrente = window.prompt("Frente", card.frente);
    if (!nextFrente) return;
    const nextVerso = window.prompt("Verso", card.verso);
    if (!nextVerso) return;
    setError(null);
    try {
      await adminAtualizarFlashcardPadrao(token, card.id, {
        disciplina: nextDisc,
        frente: nextFrente,
        verso: nextVerso,
      });
      setStatus("Flashcard global atualizado.");
      await carregar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao atualizar flashcard.");
    }
  }

  async function remover(card: FlashcardDTO) {
    if (!token) return;
    if (!window.confirm(`Remover flashcard global "${card.frente}"?`)) return;
    setError(null);
    try {
      await adminRemoverFlashcardPadrao(token, card.id);
      setStatus("Flashcard global removido.");
      await carregar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao remover flashcard.");
    }
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-800/80 bg-ink-900/60 p-6">
        <h1 className="text-2xl font-semibold text-white">Admin Flashcards</h1>
        <p className="mt-2 text-sm text-slate-400">
          Gerencie flashcards globais exibidos para todos os usuários.
        </p>
      </header>

      {error ? <p className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p> : null}
      {status ? <p className="rounded border border-sea-500/30 bg-sea-500/10 px-3 py-2 text-sm text-sea-200">{status}</p> : null}

      <section className="space-y-3 rounded-2xl border border-slate-800/80 bg-ink-900/50 p-4">
        <h2 className="text-sm font-semibold text-white">Novo flashcard global</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={disciplina}
            onChange={(e) => setDisciplina(e.target.value)}
            placeholder="Disciplina"
            className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100"
            list="disciplines-admin-flashcards"
          />
          <input
            value={frente}
            onChange={(e) => setFrente(e.target.value)}
            placeholder="Frente"
            className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100"
          />
          <textarea
            value={verso}
            onChange={(e) => setVerso(e.target.value)}
            placeholder="Verso"
            rows={4}
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
          className="rounded bg-sea-500 px-3 py-2 text-sm font-semibold text-ink-950"
        >
          Criar global
        </button>
        <datalist id="disciplines-admin-flashcards">
          {disciplinas.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-800/80 bg-ink-900/50 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Flashcards globais</h2>
          <select
            value={disciplinaFiltro}
            onChange={(e) => setDisciplinaFiltro(e.target.value)}
            className="rounded border border-slate-700 bg-ink-950 px-2 py-1 text-xs text-slate-200"
          >
            <option value="">Todas disciplinas</option>
            {disciplinas.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        {loading ? <p className="text-slate-500">Carregando...</p> : null}
        {!loading && cards.length === 0 ? <p className="text-sm text-slate-500">Nenhum flashcard global.</p> : null}
        <div className="space-y-2">
          {cards.map((card) => (
            <div key={card.id} className="rounded-lg border border-slate-800 bg-ink-950/40 p-3">
              <p className="text-xs text-slate-500">{card.disciplina}</p>
              <p className="text-sm font-semibold text-slate-100">{card.frente}</p>
              <p className="mt-1 text-xs text-slate-300">{card.verso}</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => void editar(card)}
                  className="rounded border border-slate-700 px-2 py-1 text-xs text-sea-200 hover:bg-slate-800"
                >
                  editar
                </button>
                <button
                  type="button"
                  onClick={() => void remover(card)}
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
