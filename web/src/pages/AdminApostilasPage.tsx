import { useEffect, useMemo, useState } from "react";
import {
  adminAtualizarArquivoApostila,
  adminCriarArquivoApostila,
  adminCriarAssuntoApostila,
  adminCriarDisciplinaApostila,
  adminListarDisciplinasSugestaoApostila,
  adminListarApostilasCatalogo,
  adminUploadArquivoApostila,
  adminRemoverArquivoApostila,
  adminRemoverAssuntoApostila,
  adminRemoverDisciplinaApostila,
} from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { ApostilaDisciplinaCatalogo } from "../types";

export function AdminApostilasPage() {
  const { token } = useAuth();
  const [catalogo, setCatalogo] = useState<ApostilaDisciplinaCatalogo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [disciplinasSugestao, setDisciplinasSugestao] = useState<string[]>([]);

  const [novaDisciplina, setNovaDisciplina] = useState("");
  const [disciplinaIdAssunto, setDisciplinaIdAssunto] = useState<number | "">("");
  const [novoAssunto, setNovoAssunto] = useState("");
  const [assuntoIdArquivo, setAssuntoIdArquivo] = useState<number | "">("");
  const [novoArquivoTitulo, setNovoArquivoTitulo] = useState("");
  const [novoArquivoUrl, setNovoArquivoUrl] = useState("");
  const [novoArquivoFile, setNovoArquivoFile] = useState<File | null>(null);
  const [novoArquivoPaginas, setNovoArquivoPaginas] = useState("");

  const assuntos = useMemo(
    () => catalogo.flatMap((d) => d.trilhas.map((a) => ({ id: a.id, nome: `${d.disciplina} > ${a.assunto}` }))),
    [catalogo]
  );

  async function carregar() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [data, sugestoes] = await Promise.all([
        adminListarApostilasCatalogo(token),
        adminListarDisciplinasSugestaoApostila(token),
      ]);
      setCatalogo(data);
      setDisciplinasSugestao(sugestoes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar catálogo");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, [token]);

  async function run(action: () => Promise<ApostilaDisciplinaCatalogo[]>, okMessage: string) {
    setError(null);
    setStatus(null);
    try {
      const next = await action();
      setCatalogo(next);
      setStatus(okMessage);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha na operação");
    }
  }

  function validarCriacaoArquivo(): boolean {
    if (!assuntoIdArquivo) {
      setError("Selecione um assunto para o PDF.");
      return false;
    }
    if (!novoArquivoTitulo.trim()) {
      setError("Informe o título do PDF.");
      return false;
    }
    if (!novoArquivoUrl.trim()) {
      if (!novoArquivoFile) {
        setError("Informe uma URL ou selecione um arquivo PDF.");
        return false;
      }
    }
    if (novoArquivoFile && !novoArquivoFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Selecione um arquivo PDF válido.");
      return false;
    }
    return true;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Administração de Apostilas</h1>
      <p className="text-slate-400">
        Gerencie disciplinas, trilhas por assunto e arquivos PDF do catálogo.
      </p>

      {error ? <p className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p> : null}
      {status ? <p className="rounded border border-sea-500/30 bg-sea-500/10 px-3 py-2 text-sm text-sea-200">{status}</p> : null}

      <section className="grid gap-3 rounded-2xl border border-slate-800/80 bg-ink-900/50 p-5 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-white">Nova disciplina</p>
          <input value={novaDisciplina} onChange={(e) => setNovaDisciplina(e.target.value)} placeholder="Ex.: REDES" className="w-full rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100" />
          <button
            type="button"
            onClick={() =>
              void run(() => adminCriarDisciplinaApostila(token!, novaDisciplina), "Disciplina criada com sucesso.")
            }
            className="rounded bg-sea-500 px-3 py-2 text-sm font-semibold text-ink-950"
          >
            Adicionar disciplina
          </button>
          {disciplinasSugestao.length > 0 ? (
            <div className="pt-2">
              <p className="mb-1 text-xs text-slate-400">Sugestões (base de questões)</p>
              <div className="flex flex-wrap gap-2">
                {disciplinasSugestao
                  .filter((s) => !catalogo.some((d) => d.disciplina.toLowerCase() === s.toLowerCase()))
                  .map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() =>
                        void run(() => adminCriarDisciplinaApostila(token!, sug), `Disciplina ${sug} criada.`)
                      }
                      className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-sea-400 hover:text-sea-200"
                    >
                      + {sug}
                    </button>
                  ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-white">Novo assunto/trilha</p>
          <select value={disciplinaIdAssunto} onChange={(e) => setDisciplinaIdAssunto(e.target.value ? Number(e.target.value) : "")} className="w-full rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100">
            <option value="">Selecione a disciplina</option>
            {catalogo.map((d) => (
              <option key={d.id} value={d.id}>
                {d.disciplina}
              </option>
            ))}
          </select>
          <input value={novoAssunto} onChange={(e) => setNovoAssunto(e.target.value)} placeholder="Ex.: Protocolos TCP/IP" className="w-full rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100" />
          <button
            type="button"
            onClick={() =>
              void run(
                () => adminCriarAssuntoApostila(token!, Number(disciplinaIdAssunto), novoAssunto),
                "Assunto criado com sucesso."
              )
            }
            className="rounded bg-sea-500 px-3 py-2 text-sm font-semibold text-ink-950"
          >
            Adicionar assunto
          </button>
        </div>
      </section>

      <section className="space-y-2 rounded-2xl border border-slate-800/80 bg-ink-900/50 p-5">
        <p className="text-sm font-semibold text-white">Novo arquivo PDF</p>
        <div className="grid gap-3 md:grid-cols-2">
          <select value={assuntoIdArquivo} onChange={(e) => setAssuntoIdArquivo(e.target.value ? Number(e.target.value) : "")} className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100">
            <option value="">Selecione o assunto</option>
            {assuntos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
          <input value={novoArquivoTitulo} onChange={(e) => setNovoArquivoTitulo(e.target.value)} placeholder="Título do PDF" className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100" />
          <input value={novoArquivoUrl} onChange={(e) => setNovoArquivoUrl(e.target.value)} placeholder="URL do PDF (opcional)" className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100 md:col-span-2" />
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => setNovoArquivoFile(e.target.files?.[0] ?? null)}
            className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100 md:col-span-2"
          />
          <input value={novoArquivoPaginas} onChange={(e) => setNovoArquivoPaginas(e.target.value)} placeholder="Páginas (opcional)" className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100" />
        </div>
        <button
          type="button"
          onClick={() => {
            if (!validarCriacaoArquivo()) return;
            if (novoArquivoFile) {
              void run(
                () =>
                  adminUploadArquivoApostila(token!, {
                    assuntoId: Number(assuntoIdArquivo),
                    titulo: novoArquivoTitulo.trim(),
                    paginas: novoArquivoPaginas ? Number(novoArquivoPaginas) : undefined,
                    arquivoPdf: novoArquivoFile,
                  }),
                "Arquivo PDF enviado com sucesso."
              );
              return;
            }
            void run(() => adminCriarArquivoApostila(token!, {
              assuntoId: Number(assuntoIdArquivo),
              titulo: novoArquivoTitulo.trim(),
              url: novoArquivoUrl.trim(),
              paginas: novoArquivoPaginas ? Number(novoArquivoPaginas) : undefined,
            }), "Arquivo criado com sucesso.");
          }}
          className="rounded bg-sea-500 px-3 py-2 text-sm font-semibold text-ink-950"
        >
          Adicionar arquivo
        </button>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-800/80 bg-ink-900/50 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Catálogo atual</p>
          <button type="button" onClick={() => void carregar()} className="text-xs text-sea-300 hover:text-sea-200">
            Atualizar
          </button>
        </div>

        {loading ? <p className="text-slate-500">Carregando...</p> : null}
        {!loading && catalogo.length === 0 ? <p className="text-slate-500">Nenhuma disciplina cadastrada.</p> : null}

        <div className="space-y-3">
          {catalogo.map((d) => (
            <div key={d.id} className="rounded-lg border border-slate-800 bg-ink-950/50 p-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-100">{d.disciplina}</p>
                <button
                  type="button"
                  onClick={() =>
                    void run(() => adminRemoverDisciplinaApostila(token!, d.id), "Disciplina removida.")
                  }
                  className="text-xs text-red-300 hover:text-red-200"
                >
                  remover disciplina
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {d.trilhas.map((a) => (
                  <div key={a.id} className="rounded border border-slate-800/80 bg-ink-900/60 p-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-300">{a.assunto}</p>
                      <button
                        type="button"
                        onClick={() => void run(() => adminRemoverAssuntoApostila(token!, a.id), "Assunto removido.")}
                        className="text-xs text-red-300 hover:text-red-200"
                      >
                        remover assunto
                      </button>
                    </div>
                    <div className="mt-2 space-y-1">
                      {a.arquivos.map((arq) => (
                        <div key={arq.id} className="flex items-center justify-between rounded border border-slate-800 bg-ink-950/50 px-2 py-1">
                          <span className="truncate text-xs text-slate-300">
                            {arq.titulo} {arq.paginas ? `(${arq.paginas} pág)` : ""}
                          </span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const titulo = window.prompt("Novo título", arq.titulo);
                                if (!titulo) return;
                                const url = window.prompt("Nova URL", arq.url);
                                if (!url) return;
                                const paginasRaw = window.prompt("Páginas (opcional)", arq.paginas?.toString() ?? "");
                                void run(
                                  () =>
                                    adminAtualizarArquivoApostila(token!, arq.id, {
                                      titulo,
                                      url,
                                      paginas: paginasRaw ? Number(paginasRaw) : undefined,
                                    }),
                                  "Arquivo atualizado."
                                );
                              }}
                              className="text-xs text-sea-300 hover:text-sea-200"
                            >
                              editar
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void run(() => adminRemoverArquivoApostila(token!, arq.id), "Arquivo removido.")
                              }
                              className="text-xs text-red-300 hover:text-red-200"
                            >
                              remover
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
