import { useEffect, useMemo, useState } from "react";
import {
  criarFlashcardPadraoAdmin,
  criarFlashcardPessoal,
  fetchFlashcards,
  fetchFlashcardsDisciplinas,
  fetchFlashcardsPendentes,
  revisarFlashcard,
} from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { FlashcardDTO, FlashcardReviewResult } from "../types";

type FlashcardSourceFilter = "TODOS" | "PADRAO" | "PESSOAL";
type StudyModalMode = "pendentes" | "disciplina";

export function FlashcardsPage() {
  const { token, isAdmin } = useAuth();
  const [cards, setCards] = useState<FlashcardDTO[]>([]);
  const [pendentes, setPendentes] = useState<FlashcardDTO[]>([]);
  const [disciplinas, setDisciplinas] = useState<string[]>([]);
  const [origemFiltro, setOrigemFiltro] = useState<FlashcardSourceFilter>("TODOS");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [novaDisciplina, setNovaDisciplina] = useState("");
  const [novaFrente, setNovaFrente] = useState("");
  const [novoVerso, setNovoVerso] = useState("");
  const [novaImagem, setNovaImagem] = useState<File | null>(null);
  const [criarComoPadrao, setCriarComoPadrao] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [studyModal, setStudyModal] = useState<{
    open: boolean;
    mode: StudyModalMode;
    title: string;
    disciplina: string | null;
    cards: FlashcardDTO[];
    index: number;
    showAnswer: boolean;
  }>({
    open: false,
    mode: "disciplina",
    title: "",
    disciplina: null,
    cards: [],
    index: 0,
    showAnswer: false,
  });
  const semPendencias = pendentes.length === 0;

  async function carregar() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [disciplinasData, cardsData, pendentesData] = await Promise.all([
        fetchFlashcardsDisciplinas(token),
        fetchFlashcards(token, { origem: origemFiltro }),
        fetchFlashcardsPendentes(token, { origem: origemFiltro }),
      ]);
      setDisciplinas(disciplinasData);
      setCards(cardsData);
      setPendentes(pendentesData);
      return { disciplinasData, cardsData, pendentesData };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar flashcards.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, [token, origemFiltro]);

  async function onCriarFlashcard() {
    if (!token) return;
    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      if (criarComoPadrao && isAdmin) {
        await criarFlashcardPadraoAdmin(token, {
          disciplina: novaDisciplina,
          frente: novaFrente,
          verso: novoVerso,
          imagem: novaImagem,
        });
        setStatus("Flashcard padrão criado e disponibilizado para todos os usuários.");
      } else {
        await criarFlashcardPessoal(token, {
          disciplina: novaDisciplina,
          frente: novaFrente,
          verso: novoVerso,
          imagem: novaImagem,
        });
        setStatus("Flashcard pessoal criado com sucesso.");
      }
      setNovaDisciplina("");
      setNovaFrente("");
      setNovoVerso("");
      setNovaImagem(null);
      setCriarComoPadrao(false);
      setShowCreateForm(false);
      await carregar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao criar flashcard.");
    } finally {
      setSaving(false);
    }
  }

  function abrirModalPendentes() {
    setStudyModal({
      open: true,
      mode: "pendentes",
      title: "Revisões pendentes hoje",
      disciplina: null,
      cards: pendentes,
      index: 0,
      showAnswer: false,
    });
  }

  function abrirModalDisciplina(disciplina: string) {
    const scopedCards = disciplina === "TODOS" ? cards : cards.filter((c) => c.disciplina === disciplina);
    setStudyModal({
      open: true,
      mode: "disciplina",
      title: disciplina === "TODOS" ? "Todos os flashcards" : `Disciplina: ${disciplina}`,
      disciplina: disciplina === "TODOS" ? null : disciplina,
      cards: scopedCards,
      index: 0,
      showAnswer: false,
    });
  }

  function fecharModal() {
    setStudyModal((prev) => ({ ...prev, open: false }));
  }

  function cardAnterior() {
    setStudyModal((prev) => ({
      ...prev,
      index: Math.max(prev.index - 1, 0),
      showAnswer: false,
    }));
  }

  function cardProximo() {
    setStudyModal((prev) => ({
      ...prev,
      index: Math.min(prev.index + 1, Math.max(prev.cards.length - 1, 0)),
      showAnswer: false,
    }));
  }

  async function onRevisar(cardId: number, resultado: FlashcardReviewResult) {
    if (!token) return;
    setError(null);
    try {
      await revisarFlashcard(token, cardId, resultado);
      const refreshed = await carregar();
      if (!refreshed) return;

      setStudyModal((prev) => {
        if (!prev.open) return prev;
        const nextCards =
          prev.mode === "pendentes"
            ? refreshed.pendentesData
            : prev.disciplina
              ? refreshed.cardsData.filter((c) => c.disciplina === prev.disciplina)
              : refreshed.cardsData;
        const nextIndex = Math.min(prev.index, Math.max(nextCards.length - 1, 0));
        return {
          ...prev,
          cards: nextCards,
          index: nextIndex,
          showAnswer: false,
        };
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao registrar revisão.");
    }
  }

  const cardAtual = useMemo(() => {
    if (!studyModal.open || studyModal.cards.length === 0) return null;
    return studyModal.cards[studyModal.index] ?? null;
  }, [studyModal]);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-800/80 bg-ink-900/60 p-6">
        <h1 className="text-2xl font-semibold text-white">Flashcards</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Revisão espaçada no estilo Anki, com cards padrão (globais) e pessoais. Intervalos usados:
          1, 7, 15 e 30 dias.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-ink-950/60 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total de cards</p>
            <p className="mt-1 text-xl font-semibold text-white">{cards.length}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-ink-950/60 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Pendentes hoje</p>
            <p className={`mt-1 text-xl font-semibold ${semPendencias ? "text-sea-300" : "text-amber-300"}`}>
              {pendentes.length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-ink-950/60 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Disciplinas</p>
            <p className="mt-1 text-xl font-semibold text-white">{disciplinas.length}</p>
          </div>
        </div>
      </header>

      {error ? <p className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p> : null}
      {status ? <p className="rounded border border-sea-500/30 bg-sea-500/10 px-3 py-2 text-sm text-sea-200">{status}</p> : null}
      {loading ? <p className="text-sm text-slate-500">Atualizando flashcards...</p> : null}

      <section>
        {(() => {
          const boxClass = semPendencias
            ? "border-sea-500/30 bg-sea-500/10 hover:bg-sea-500/15"
            : "border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/15";
          const labelClass = semPendencias ? "text-sea-300" : "text-amber-300";
          const countClass = semPendencias ? "text-sea-200" : "text-amber-200";
          return (
        <button
          type="button"
          onClick={abrirModalPendentes}
          className={`w-full rounded-2xl border p-5 text-left transition ${boxClass}`}
        >
          <p className={`text-xs uppercase tracking-wide ${labelClass}`}>Revisões pendentes hoje</p>
          <p className={`mt-2 text-3xl font-semibold ${countClass}`}>{pendentes.length}</p>
        </button>
          );
        })()}
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-800/80 bg-ink-900/50 p-4 md:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-white">Filtrar origem</p>
          <select
            value={origemFiltro}
            onChange={(e) => setOrigemFiltro(e.target.value as FlashcardSourceFilter)}
            className="w-full rounded border border-slate-700 bg-ink-950 px-3 py-2 text-sm text-slate-100"
          >
            <option value="TODOS">Todos</option>
            <option value="PADRAO">Padrão (admin)</option>
            <option value="PESSOAL">Pessoais</option>
          </select>
        </div>
        <div className="flex items-end">
          <button type="button" onClick={() => void carregar()} className="text-xs text-sea-300 hover:text-sea-200">
            Atualizar dados
          </button>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-800/80 bg-ink-900/50 p-4">
        <p className="text-sm font-semibold text-white">Disciplinas</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {["TODOS", ...disciplinas].map((disc) => {
            const totalDisc = disc === "TODOS" ? cards.length : cards.filter((c) => c.disciplina === disc).length;
            return (
              <button
                key={disc}
                type="button"
                onClick={() => abrirModalDisciplina(disc)}
                className="h-24 rounded-xl border border-slate-700 bg-ink-950/70 px-4 py-3 text-left transition hover:border-sea-500/40 hover:bg-sea-500/5"
              >
                <p className="truncate text-sm font-semibold text-slate-100">{disc === "TODOS" ? "Todos" : disc}</p>
                <p className="mt-1 text-xs text-slate-400">{totalDisc} card(s)</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800/80 bg-ink-900/50 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Criar flashcards</h2>
          <button
            type="button"
            onClick={() => setShowCreateForm((v) => !v)}
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800"
          >
            {showCreateForm ? "Fechar" : "Criar novo flashcard"}
          </button>
        </div>
        {showCreateForm ? (
          <div className="mt-4 grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={novaDisciplina}
                onChange={(e) => setNovaDisciplina(e.target.value)}
                placeholder="Disciplina"
                className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100"
                list="flashcard-disciplinas"
              />
              <input
                value={novaFrente}
                onChange={(e) => setNovaFrente(e.target.value)}
                placeholder="Frente do card (pergunta/chave)"
                className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100"
              />
              <textarea
                value={novoVerso}
                onChange={(e) => setNovoVerso(e.target.value)}
                placeholder="Verso do card (resposta)"
                className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100 md:col-span-2"
                rows={4}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNovaImagem(e.target.files?.[0] ?? null)}
                className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100 md:col-span-2"
              />
              {isAdmin ? (
                <label className="inline-flex items-center gap-2 text-xs text-slate-300 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={criarComoPadrao}
                    onChange={(e) => setCriarComoPadrao(e.target.checked)}
                  />
                  Criar como flashcard padrão (visível para todos os usuários)
                </label>
              ) : null}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void onCriarFlashcard()}
                disabled={saving}
                className="rounded-lg bg-sea-500 px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-sea-400 disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Criar flashcard"}
              </button>
            </div>
            <datalist id="flashcard-disciplinas">
              {disciplinas.map((disc) => (
                <option key={disc} value={disc} />
              ))}
            </datalist>
          </div>
        ) : null}
      </section>

      {studyModal.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-ink-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">{studyModal.title}</p>
                <p className="text-sm text-slate-300">
                  {studyModal.cards.length === 0
                    ? "Sem cards para revisar"
                    : `Card ${studyModal.index + 1} de ${studyModal.cards.length}`}
                </p>
              </div>
              <button
                type="button"
                onClick={fecharModal}
                className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
              >
                Fechar
              </button>
            </div>
            <div className="space-y-4 p-4">
              {!cardAtual ? (
                <p className="text-sm text-slate-400">Nenhum flashcard disponível neste conjunto.</p>
              ) : (
                <>
                  <div className="rounded-xl border border-slate-800 bg-ink-900/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{cardAtual.disciplina}</p>
                    <p className="mt-2 text-lg font-semibold text-slate-100">{cardAtual.frente}</p>
                    {studyModal.showAnswer ? (
                      <>
                        <p className="mt-4 text-sm text-slate-300">{cardAtual.verso}</p>
                        {cardAtual.imagemDataUrl ? (
                          <img
                            src={cardAtual.imagemDataUrl}
                            alt="Anexo do flashcard"
                            className="mt-4 max-h-64 w-full rounded-lg border border-slate-800 object-contain bg-ink-950"
                          />
                        ) : null}
                      </>
                    ) : (
                      <p className="mt-4 text-sm text-slate-500">Clique em "Ver resposta" para revelar o verso.</p>
                    )}
                  </div>

                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setStudyModal((prev) => ({ ...prev, showAnswer: !prev.showAnswer }))}
                      className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
                    >
                      {studyModal.showAnswer ? "Ocultar resposta" : "Ver resposta"}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={cardAnterior}
                      disabled={studyModal.index === 0}
                      className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      onClick={() => void onRevisar(cardAtual.id, "ERREI")}
                      className="rounded-md border border-red-500/40 px-3 py-2 text-xs text-red-200 hover:bg-red-500/10"
                    >
                      Errei
                    </button>
                    <button
                      type="button"
                      onClick={() => void onRevisar(cardAtual.id, "ACERTEI")}
                      className="rounded-md border border-sea-500/40 px-3 py-2 text-xs text-sea-200 hover:bg-sea-500/10"
                    >
                      Acertei
                    </button>
                    <button
                      type="button"
                      onClick={cardProximo}
                      disabled={studyModal.index >= studyModal.cards.length - 1}
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
