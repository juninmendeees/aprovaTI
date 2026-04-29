import { useEffect, useMemo, useRef, useState } from "react";
import { fetchApostilasCatalogo, fetchApostilasProgresso, salvarApostilaProgresso } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type {
  ApostilaDisciplinaCatalogo,
  ApostilaHighlight,
  ApostilaProgressoResponse,
} from "../types";

type StudyState = {
  concluded: Record<string, boolean>;
  notes: Record<string, string>;
  highlights: Record<string, ApostilaHighlight[]>;
  lastPage: Record<string, number | null>;
};

function prettyDisciplina(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function emptyState(): StudyState {
  return { concluded: {}, notes: {}, highlights: {}, lastPage: {} };
}

function toProgressoPayload(pdfId: string, state: StudyState): ApostilaProgressoResponse {
  return {
    pdfId,
    concluido: !!state.concluded[pdfId],
    anotacoes: state.notes[pdfId] ?? "",
    grifos: state.highlights[pdfId] ?? [],
    ultimaPagina: state.lastPage[pdfId] ?? null,
  };
}

export function ApostilasPage() {
  const { token } = useAuth();
  const [catalogo, setCatalogo] = useState<ApostilaDisciplinaCatalogo[]>([]);
  const [loadingCatalogo, setLoadingCatalogo] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedDiscId, setSelectedDiscId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [state, setState] = useState<StudyState>(emptyState);
  const [selectedPdfId, setSelectedPdfId] = useState<string | null>(null);
  const [highlightInput, setHighlightInput] = useState("");
  const [highlightColor, setHighlightColor] = useState<ApostilaHighlight["cor"]>("yellow");
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [readerOpen, setReaderOpen] = useState(false);
  const [pdfObjectUrl, setPdfObjectUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);
  const [pdfReloadToken, setPdfReloadToken] = useState(0);
  const debounceRef = useRef<Record<string, number>>({});

  useEffect(() => {
    return () => {
      Object.values(debounceRef.current).forEach((id) => clearTimeout(id));
    };
  }, []);

  useEffect(() => {
    return () => {
      if (pdfObjectUrl) {
        URL.revokeObjectURL(pdfObjectUrl);
      }
    };
  }, [pdfObjectUrl]);

  useEffect(() => {
    async function carregarCatalogo() {
      if (!token) return;
      setLoadingCatalogo(true);
      try {
        const data = await fetchApostilasCatalogo(token);
        setCatalogo(data);
        if (data.length > 0 && selectedDiscId == null) {
          setSelectedDiscId(data[0].id);
          const firstPdf = data[0].trilhas[0]?.arquivos[0];
          if (firstPdf) setSelectedPdfId(String(firstPdf.id));
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Falha ao carregar catálogo de apostilas.";
        setSyncStatus(msg);
      } finally {
        setLoadingCatalogo(false);
      }
    }
    void carregarCatalogo();
  }, [token, selectedDiscId]);

  useEffect(() => {
    async function carregarProgresso() {
      if (!token) return;
      try {
        const response = await fetchApostilasProgresso(token);
        const next = emptyState();
        response.forEach((p) => {
          next.concluded[p.pdfId] = !!p.concluido;
          next.notes[p.pdfId] = p.anotacoes ?? "";
          next.highlights[p.pdfId] = p.grifos ?? [];
          next.lastPage[p.pdfId] = p.ultimaPagina ?? null;
        });
        setState(next);
      } catch {
        setSyncStatus("Falha ao sincronizar progresso. Continuando em modo local nesta sessão.");
      }
    }
    void carregarProgresso();
  }, [token]);

  const filteredDisciplinas = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalogo;
    return catalogo.filter((d) => {
      if (d.disciplina.toLowerCase().includes(q)) return true;
      if (prettyDisciplina(d.disciplina).toLowerCase().includes(q)) return true;
      return d.trilhas.some(
        (t) =>
          t.assunto.toLowerCase().includes(q) ||
          t.arquivos.some((a) => a.titulo.toLowerCase().includes(q))
      );
    });
  }, [catalogo, query]);

  const disciplinaAtual =
    filteredDisciplinas.find((d) => d.id === selectedDiscId) ?? filteredDisciplinas[0] ?? null;

  useEffect(() => {
    if (!disciplinaAtual) return;
    if (disciplinaAtual.id !== selectedDiscId) setSelectedDiscId(disciplinaAtual.id);
  }, [disciplinaAtual, selectedDiscId]);

  const allPdfs = useMemo(
    () => catalogo.flatMap((d) => d.trilhas.flatMap((t) => t.arquivos.map((a) => ({ ...a, id: String(a.id) })))),
    [catalogo]
  );

  const selectedPdf = useMemo(() => {
    if (!selectedPdfId) return null;
    return allPdfs.find((p) => p.id === selectedPdfId) ?? null;
  }, [allPdfs, selectedPdfId]);

  const concluidasCount = useMemo(
    () => allPdfs.filter((pdf) => state.concluded[pdf.id]).length,
    [allPdfs, state.concluded]
  );

  const notasAtuais = selectedPdf ? state.notes[selectedPdf.id] ?? "" : "";
  const grifosAtuais = selectedPdf ? state.highlights[selectedPdf.id] ?? [] : [];
  const ultimaPaginaAtual = selectedPdf ? state.lastPage[selectedPdf.id] ?? null : null;

  async function persistPdf(pdfId: string, nextState: StudyState) {
    if (!token) return;
    try {
      await salvarApostilaProgresso(token, toProgressoPayload(pdfId, nextState));
      setSyncStatus(null);
    } catch {
      setSyncStatus("Não foi possível sincronizar agora. Tentaremos novamente nas próximas alterações.");
    }
  }

  function toggleConcluida(pdfId: string) {
    setState((prev) => {
      const next: StudyState = {
        ...prev,
        concluded: { ...prev.concluded, [pdfId]: !prev.concluded[pdfId] },
      };
      void persistPdf(pdfId, next);
      return next;
    });
  }

  function saveNota(pdfId: string, content: string) {
    setState((prev) => {
      const next: StudyState = {
        ...prev,
        notes: { ...prev.notes, [pdfId]: content },
      };
      if (debounceRef.current[pdfId]) clearTimeout(debounceRef.current[pdfId]);
      debounceRef.current[pdfId] = window.setTimeout(() => {
        void persistPdf(pdfId, next);
      }, 700);
      return next;
    });
  }

  function salvarUltimaPagina(pdfId: string, pageValue: string) {
    const parsed = Number(pageValue);
    const nextPage = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null;
    setState((prev) => {
      const next: StudyState = {
        ...prev,
        lastPage: { ...prev.lastPage, [pdfId]: nextPage },
      };
      if (debounceRef.current[`page-${pdfId}`]) clearTimeout(debounceRef.current[`page-${pdfId}`]);
      debounceRef.current[`page-${pdfId}`] = window.setTimeout(() => {
        void persistPdf(pdfId, next);
      }, 700);
      return next;
    });
  }

  function addHighlight() {
    if (!selectedPdf) return;
    const text = highlightInput.trim();
    if (!text) return;
    const item: ApostilaHighlight = {
      id: crypto.randomUUID(),
      texto: text,
      cor: highlightColor,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => {
      const next: StudyState = {
        ...prev,
        highlights: {
          ...prev.highlights,
          [selectedPdf.id]: [item, ...(prev.highlights[selectedPdf.id] ?? [])],
        },
      };
      void persistPdf(selectedPdf.id, next);
      return next;
    });
    setHighlightInput("");
  }

  function removeHighlight(highlightId: string) {
    if (!selectedPdf) return;
    setState((prev) => {
      const next: StudyState = {
        ...prev,
        highlights: {
          ...prev.highlights,
          [selectedPdf.id]: (prev.highlights[selectedPdf.id] ?? []).filter((h) => h.id !== highlightId),
        },
      };
      void persistPdf(selectedPdf.id, next);
      return next;
    });
  }

  function fecharLeitor() {
    if (selectedPdf) {
      void persistPdf(selectedPdf.id, state);
    }
    setReaderOpen(false);
  }

  function recarregarPdf() {
    setPdfReloadToken((v) => v + 1);
  }

  useEffect(() => {
    if (!readerOpen || !selectedPdf) {
      if (pdfObjectUrl) {
        URL.revokeObjectURL(pdfObjectUrl);
      }
      setPdfObjectUrl(null);
      setPdfLoadError(null);
      setLoadingPdf(false);
      return;
    }

    const selectedPdfUrl = selectedPdf.url;
    const isLikelyProtectedApiPath = selectedPdfUrl.startsWith("/");
    if (!isLikelyProtectedApiPath) {
      if (pdfObjectUrl) {
        URL.revokeObjectURL(pdfObjectUrl);
      }
      setPdfObjectUrl(null);
      setPdfLoadError(null);
      setLoadingPdf(false);
      return;
    }

    if (!token) {
      setPdfLoadError("Sessão inválida para carregar o PDF.");
      return;
    }

    const controller = new AbortController();
    let disposed = false;

    async function carregarPdfProtegido() {
      setLoadingPdf(true);
      setPdfLoadError(null);
      try {
        const response = await fetch(selectedPdfUrl, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Falha ao carregar PDF (${response.status}).`);
        }
        const pdfBlob = await response.blob();
        if (disposed) return;
        const nextUrl = URL.createObjectURL(pdfBlob);
        setPdfObjectUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return nextUrl;
        });
      } catch (err) {
        if (controller.signal.aborted || disposed) return;
        const message = err instanceof Error ? err.message : "Não foi possível carregar o PDF.";
        setPdfLoadError(message);
        setPdfObjectUrl(null);
      } finally {
        if (!disposed) {
          setLoadingPdf(false);
        }
      }
    }

    void carregarPdfProtegido();

    return () => {
      disposed = true;
      controller.abort();
    };
  }, [readerOpen, selectedPdf, token, pdfReloadToken]);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-800/80 bg-ink-900/60 p-6">
        <h1 className="text-2xl font-semibold text-white">Apostilas</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Biblioteca por disciplina e trilhas por assunto, com leitura integrada, marcação de conclusão,
          anotações e grifos de estudo.
        </p>
        {syncStatus ? <p className="mt-2 text-xs text-amber-300">{syncStatus}</p> : null}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-ink-950/60 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total de PDFs</p>
            <p className="mt-1 text-xl font-semibold text-white">{allPdfs.length}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-ink-950/60 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Concluídos</p>
            <p className="mt-1 text-xl font-semibold text-sea-300">{concluidasCount}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-ink-950/60 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Disciplinas</p>
            <p className="mt-1 text-xl font-semibold text-white">{catalogo.length}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <aside className="space-y-4 rounded-2xl border border-slate-800/80 bg-ink-900/50 p-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar disciplina, trilha ou PDF"
            className="w-full rounded-lg border border-slate-700 bg-ink-950 px-3 py-2 text-sm text-slate-100"
          />

          <div className="max-h-[65vh] space-y-3 overflow-auto pr-1">
            {filteredDisciplinas.map((disciplina) => (
              <div
                key={disciplina.id}
                className={`rounded-xl border ${
                  selectedDiscId === disciplina.id
                    ? "border-sea-500/40 bg-sea-500/5"
                    : "border-slate-800 bg-ink-950/40"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedDiscId(disciplina.id)}
                  className="w-full px-3 py-2 text-left"
                >
                  <p className="text-xs uppercase tracking-wide text-slate-500">Disciplina</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-100">
                    {prettyDisciplina(disciplina.disciplina)}
                  </p>
                </button>
              </div>
            ))}
          </div>
        </aside>

        <section className="space-y-4 rounded-2xl border border-slate-800/80 bg-ink-900/50 p-4">
          {loadingCatalogo ? (
            <p className="text-slate-400">Carregando catálogo...</p>
          ) : !disciplinaAtual ? (
            <p className="text-slate-400">Nenhuma disciplina cadastrada.</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">{prettyDisciplina(disciplinaAtual.disciplina)}</h2>
                <span className="text-xs text-slate-500">Trilhas por assunto</span>
              </div>

              <div className="space-y-3">
                {disciplinaAtual.trilhas.map((trilha, idx) => {
                  const key = `${disciplinaAtual.id}-${idx}`;
                  const opened = expanded[key] ?? true;

                  return (
                    <div key={key} className="rounded-xl border border-slate-800 bg-ink-950/35">
                      <button
                        type="button"
                        onClick={() => setExpanded((prev) => ({ ...prev, [key]: !opened }))}
                        className="flex w-full items-center justify-between px-4 py-3"
                      >
                        <span className="text-sm font-medium text-slate-200">{trilha.assunto}</span>
                        <span className="text-xs text-slate-500">{opened ? "Ocultar" : "Exibir"}</span>
                      </button>

                      {opened ? (
                        <div className="space-y-2 border-t border-slate-800 p-3">
                          {trilha.arquivos.map((pdf) => {
                            const pdfKey = String(pdf.id);
                            const isConcluida = !!state.concluded[pdfKey];
                            const isSelecionada = selectedPdf?.id === pdfKey;

                            return (
                              <div
                                key={pdf.id}
                                className={`rounded-lg border px-3 py-2 ${
                                  isSelecionada
                                    ? "border-sea-500/40 bg-sea-500/10"
                                    : "border-slate-800 bg-ink-900/60"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPdfId(pdfKey);
                                    setReaderOpen(true);
                                  }}
                                  className="w-full text-left"
                                >
                                  <p className="text-sm font-medium text-slate-100">{pdf.titulo}</p>
                                  <p className="mt-0.5 text-xs text-slate-500">
                                    {pdf.paginas ? `${pdf.paginas} páginas` : "PDF"}
                                  </p>
                                </button>

                                <div className="mt-2 flex items-center justify-between">
                                  <button
                                    type="button"
                                    onClick={() => toggleConcluida(pdfKey)}
                                    className={`rounded-md px-2 py-1 text-xs font-medium ${
                                      isConcluida
                                        ? "bg-sea-500/20 text-sea-200"
                                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                    }`}
                                  >
                                    {isConcluida ? "Concluído" : "Marcar concluído"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedPdfId(pdfKey);
                                      setReaderOpen(true);
                                    }}
                                    className="text-xs text-sea-300 hover:text-sea-200"
                                  >
                                    Abrir leitor
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>

      {readerOpen && selectedPdf ? (
        <section className="rounded-2xl border border-slate-700 bg-ink-950">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Leitura atual</p>
              <h3 className="text-sm font-semibold text-slate-100">{selectedPdf.titulo}</h3>
            </div>
            <button
              type="button"
              onClick={fecharLeitor}
              className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
            >
              Fechar
            </button>
          </div>

          <div className="grid min-h-0 gap-4 p-4 xl:grid-cols-[1fr_340px]">
            <div className="h-[75vh] overflow-hidden rounded-xl border border-slate-800 bg-ink-900/60">
              {loadingPdf ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  Carregando PDF...
                </div>
              ) : pdfLoadError ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
                  <p className="text-sm text-amber-300">{pdfLoadError}</p>
                  <button
                    type="button"
                    onClick={recarregarPdf}
                    className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : (
                <iframe
                  title={`Leitor PDF - ${selectedPdf.titulo}`}
                  src={
                    ultimaPaginaAtual
                      ? `${pdfObjectUrl ?? selectedPdf.url}#page=${ultimaPaginaAtual}`
                      : (pdfObjectUrl ?? selectedPdf.url)
                  }
                  className="h-full w-full"
                />
              )}
            </div>

            <div className="max-h-[75vh] space-y-3 overflow-auto rounded-xl border border-slate-800 bg-ink-900/50 p-3">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Leitura (onde parou)</p>
                <input
                  type="number"
                  min={1}
                  value={ultimaPaginaAtual ?? ""}
                  onChange={(e) => salvarUltimaPagina(selectedPdf.id, e.target.value)}
                  placeholder="Última página lida"
                  className="w-full rounded-lg border border-slate-700 bg-ink-950 px-3 py-2 text-sm text-slate-100"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Anotações</p>
                <textarea
                  value={notasAtuais}
                  onChange={(e) => saveNota(selectedPdf.id, e.target.value)}
                  rows={6}
                  placeholder="Escreva observações e pontos de revisão..."
                  className="w-full rounded-lg border border-slate-700 bg-ink-950 px-3 py-2 text-sm text-slate-100"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Grifos (manual)</p>
                <div className="flex gap-2">
                  <input
                    value={highlightInput}
                    onChange={(e) => setHighlightInput(e.target.value)}
                    placeholder="Trecho importante"
                    className="flex-1 rounded-lg border border-slate-700 bg-ink-950 px-3 py-2 text-sm text-slate-100"
                  />
                  <select
                    value={highlightColor}
                    onChange={(e) => setHighlightColor(e.target.value as ApostilaHighlight["cor"])}
                    className="rounded-lg border border-slate-700 bg-ink-950 px-2 py-2 text-sm text-slate-100"
                  >
                    <option value="yellow">Amarelo</option>
                    <option value="green">Verde</option>
                    <option value="blue">Azul</option>
                    <option value="pink">Rosa</option>
                  </select>
                  <button
                    type="button"
                    onClick={addHighlight}
                    className="rounded-lg bg-sea-500 px-3 py-2 text-sm font-semibold text-ink-950 hover:bg-sea-400"
                  >
                    Grifar
                  </button>
                </div>
                <div className="max-h-64 space-y-2 overflow-auto pr-1">
                  {grifosAtuais.length === 0 ? (
                    <p className="text-xs text-slate-500">Nenhum grifo salvo para este PDF.</p>
                  ) : (
                    grifosAtuais.map((g) => (
                      <div key={g.id} className="rounded-lg border border-slate-800 bg-ink-950/70 px-3 py-2">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[11px] text-slate-200">
                            {g.cor}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeHighlight(g.id)}
                            className="text-[11px] text-slate-500 hover:text-red-300"
                          >
                            remover
                          </button>
                        </div>
                        <p className="text-xs text-slate-200">{g.texto}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
