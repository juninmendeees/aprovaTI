import { useMemo, useState, type FormEvent } from "react";
import {
  confirmarImportacaoAdmin,
  criarQuestaoManualAdmin,
  previewImportacaoAdmin,
  previewImportacaoCsvAdmin,
  validarDuplicidadeQuestaoAdmin,
} from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { ImportPreviewResponse, ImportSummaryResponse, ImportedQuestaoDTO } from "../types";

type ManualForm = {
  tipo: "multipla" | "certo_errado";
  enunciado: string;
  disciplina: string;
  assunto: string;
  banca: string;
  ano: string;
  cargoFuncao: string;
  fonteProva: string;
  gabarito: string;
  alternativaA: string;
  alternativaB: string;
  alternativaC: string;
  alternativaD: string;
  alternativaE: string;
};

const manualInitial: ManualForm = {
  tipo: "multipla",
  enunciado: "",
  disciplina: "",
  assunto: "",
  banca: "",
  ano: "",
  cargoFuncao: "",
  fonteProva: "",
  gabarito: "A",
  alternativaA: "",
  alternativaB: "",
  alternativaC: "",
  alternativaD: "",
  alternativaE: "",
};

export function AdminImportPage() {
  const { token } = useAuth();

  const [tab, setTab] = useState<"upload" | "revisao" | "manual">("upload");
  const [importType, setImportType] = useState<"pdf" | "csv">("csv");

  const [provaPdf, setProvaPdf] = useState<File | null>(null);
  const [gabaritoPdf, setGabaritoPdf] = useState<File | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const [banca, setBanca] = useState("");
  const [ano, setAno] = useState<string>("");
  const [fonteProva, setFonteProva] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [questoesEdit, setQuestoesEdit] = useState<ImportedQuestaoDTO[]>([]);
  const [summary, setSummary] = useState<ImportSummaryResponse | null>(null);

  const [manual, setManual] = useState<ManualForm>(manualInitial);
  const [manualStatus, setManualStatus] = useState<string | null>(null);

  const orderedSummary = useMemo(() => {
    if (!summary) return [] as [string, number][];
    return Object.entries(summary.porAssunto).sort((a, b) => b[1] - a[1]);
  }, [summary]);

  const orderedPreview = useMemo(() => {
    if (!preview) return [] as [string, number][];
    return Object.entries(preview.porAssunto).sort((a, b) => b[1] - a[1]);
  }, [preview]);

  async function gerarPreview(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      let result: ImportPreviewResponse;

      if (importType === "csv") {
        if (!csvFile) throw new Error("Envie o arquivo CSV no layout padronizado.");
        result = await previewImportacaoCsvAdmin(token, csvFile);
      } else {
        if (!provaPdf || !gabaritoPdf) throw new Error("Envie os dois arquivos PDF: prova e gabarito.");
        result = await previewImportacaoAdmin(token, {
          provaPdf,
          gabaritoPdf,
          banca: banca || undefined,
          ano: ano ? Number(ano) : undefined,
          fonteProva: fonteProva || undefined,
        });
      }

      setPreview(result);
      setQuestoesEdit(result.questoes ?? []);
      setTab("revisao");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao gerar pré-visualização");
    } finally {
      setLoading(false);
    }
  }

  async function confirmar() {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const duplicadas = questoesEdit.filter((q) => q.duplicada);
      let permitirDuplicadas = false;

      if (duplicadas.length > 0) {
        const resumo = duplicadas
          .slice(0, 3)
          .map((q) => `ID ${q.duplicadaId}: ${(q.duplicadaEnunciado ?? "").slice(0, 90)}`)
          .join("\n");

        permitirDuplicadas = window.confirm(
          `Foram detectadas ${duplicadas.length} questões já existentes.\n${resumo}\n\nDeseja continuar inserindo as questões duplicadas?`
        );
      }

      const result = await confirmarImportacaoAdmin(token, questoesEdit, permitirDuplicadas);
      setSummary(result);
      setTab("upload");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao confirmar importação");
    } finally {
      setLoading(false);
    }
  }

  function updateQuestao(idx: number, field: keyof ImportedQuestaoDTO, value: string) {
    setQuestoesEdit((prev) => {
      const clone = [...prev];
      clone[idx] = { ...clone[idx], [field]: value };
      return clone;
    });
  }

  function toManualQuestao(): ImportedQuestaoDTO {
    const isCertoErrado = manual.tipo === "certo_errado";
    const alternativas = isCertoErrado
      ? [
          { letra: "A", texto: "Certo" },
          { letra: "B", texto: "Errado" },
        ]
      : [
          { letra: "A", texto: manual.alternativaA },
          { letra: "B", texto: manual.alternativaB },
          { letra: "C", texto: manual.alternativaC },
          { letra: "D", texto: manual.alternativaD },
          { letra: "E", texto: manual.alternativaE },
        ];

    const gabarito = isCertoErrado
      ? manual.gabarito === "CERTO"
        ? "A"
        : "B"
      : manual.gabarito;

    return {
      enunciado: manual.enunciado,
      disciplina: manual.disciplina,
      assunto: manual.assunto,
      banca: manual.banca,
      ano: manual.ano ? Number(manual.ano) : null,
      cargoFuncao: manual.cargoFuncao,
      fonteProva: manual.fonteProva,
      gabarito,
      alternativas,
    };
  }

  async function salvarManual(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError(null);
    setManualStatus(null);

    try {
      const questao = toManualQuestao();
      const check = await validarDuplicidadeQuestaoAdmin(token, questao);
      let confirmarDuplicada = false;

      if (check.duplicada) {
        confirmarDuplicada = window.confirm(
          `Esta questão já existe na base.\nID ${check.idQuestao}\n${check.enunciado ?? ""}\n\nDeseja continuar inserindo a questão?`
        );
        if (!confirmarDuplicada) {
          setManualStatus("Inserção abortada pelo usuário (questão duplicada).");
          return;
        }
      }

      const result = await criarQuestaoManualAdmin(token, questao, confirmarDuplicada);
      setManualStatus(`${result.mensagem} ID ${result.id}.`);
      setManual(manualInitial);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao cadastrar questão manualmente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Painel de administração</h1>
      <p className="mt-1 text-slate-400">
        Importe, revise e também cadastre questões manualmente com validação de duplicidade.
      </p>

      <div className="mt-6 inline-flex rounded-lg bg-ink-900 p-1">
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`rounded px-3 py-1.5 text-sm ${tab === "upload" ? "bg-sea-500 text-ink-950" : "text-slate-300"}`}
        >
          Upload
        </button>
        <button
          type="button"
          onClick={() => setTab("revisao")}
          className={`rounded px-3 py-1.5 text-sm ${tab === "revisao" ? "bg-sea-500 text-ink-950" : "text-slate-300"}`}
          disabled={!preview}
        >
          Pré-visualização e revisão
        </button>
        <button
          type="button"
          onClick={() => setTab("manual")}
          className={`rounded px-3 py-1.5 text-sm ${tab === "manual" ? "bg-sea-500 text-ink-950" : "text-slate-300"}`}
        >
          Cadastro manual
        </button>
      </div>

      {tab === "manual" ? (
        <form onSubmit={salvarManual} className="mt-6 grid gap-4 rounded-2xl border border-slate-800/80 bg-ink-900/50 p-6">
          <div className="inline-flex rounded-lg bg-ink-950 p-1">
            <button
              type="button"
              onClick={() => setManual((p) => ({ ...p, tipo: "multipla", gabarito: "A" }))}
              className={`rounded px-3 py-1.5 text-sm ${
                manual.tipo === "multipla" ? "bg-sea-500 text-ink-950" : "text-slate-300"
              }`}
            >
              Múltipla escolha
            </button>
            <button
              type="button"
              onClick={() => setManual((p) => ({ ...p, tipo: "certo_errado", gabarito: "CERTO" }))}
              className={`rounded px-3 py-1.5 text-sm ${
                manual.tipo === "certo_errado" ? "bg-sea-500 text-ink-950" : "text-slate-300"
              }`}
            >
              Certo / Errado
            </button>
          </div>

          <textarea
            required
            value={manual.enunciado}
            onChange={(e) => setManual((p) => ({ ...p, enunciado: e.target.value }))}
            rows={5}
            placeholder="Enunciado"
            className="w-full rounded-lg border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100"
          />

          <div className="grid gap-3 sm:grid-cols-3">
            <input required value={manual.disciplina} onChange={(e) => setManual((p) => ({ ...p, disciplina: e.target.value }))} placeholder="Disciplina (enum)" className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100" />
            <input required value={manual.assunto} onChange={(e) => setManual((p) => ({ ...p, assunto: e.target.value }))} placeholder="Assunto" className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100" />
            {manual.tipo === "multipla" ? (
              <select
                value={manual.gabarito}
                onChange={(e) => setManual((p) => ({ ...p, gabarito: e.target.value }))}
                className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100"
              >
                {["A", "B", "C", "D", "E"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            ) : (
              <select
                value={manual.gabarito}
                onChange={(e) => setManual((p) => ({ ...p, gabarito: e.target.value }))}
                className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100"
              >
                <option value="CERTO">CERTO</option>
                <option value="ERRADO">ERRADO</option>
              </select>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <input value={manual.banca} onChange={(e) => setManual((p) => ({ ...p, banca: e.target.value }))} placeholder="Banca" className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100" />
            <input value={manual.ano} onChange={(e) => setManual((p) => ({ ...p, ano: e.target.value }))} placeholder="Ano" className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100" />
            <input value={manual.cargoFuncao} onChange={(e) => setManual((p) => ({ ...p, cargoFuncao: e.target.value }))} placeholder="Cargo/Função" className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100" />
            <input value={manual.fonteProva} onChange={(e) => setManual((p) => ({ ...p, fonteProva: e.target.value }))} placeholder="Fonte da prova" className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100" />
          </div>

          {manual.tipo === "multipla" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <input required value={manual.alternativaA} onChange={(e) => setManual((p) => ({ ...p, alternativaA: e.target.value }))} placeholder="Alternativa A" className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100" />
              <input required value={manual.alternativaB} onChange={(e) => setManual((p) => ({ ...p, alternativaB: e.target.value }))} placeholder="Alternativa B" className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100" />
              <input required value={manual.alternativaC} onChange={(e) => setManual((p) => ({ ...p, alternativaC: e.target.value }))} placeholder="Alternativa C" className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100" />
              <input required value={manual.alternativaD} onChange={(e) => setManual((p) => ({ ...p, alternativaD: e.target.value }))} placeholder="Alternativa D" className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100" />
              <input required value={manual.alternativaE} onChange={(e) => setManual((p) => ({ ...p, alternativaE: e.target.value }))} placeholder="Alternativa E" className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100 sm:col-span-2" />
            </div>
          ) : (
            <div className="rounded-lg border border-sea-500/25 bg-sea-500/10 px-3 py-2 text-sm text-sea-100">
              Questão do tipo certo/errado: as opções serão cadastradas automaticamente como
              <strong> A) Certo</strong> e <strong>B) Errado</strong>.
            </div>
          )}

          {error ? <p className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p> : null}
          {manualStatus ? <p className="rounded border border-sea-500/30 bg-sea-500/10 px-3 py-2 text-sm text-sea-200">{manualStatus}</p> : null}

          <div>
            <button type="submit" disabled={loading} className="rounded-xl bg-sea-500 px-5 py-2.5 font-semibold text-ink-950 transition hover:bg-sea-400 disabled:opacity-60">
              {loading ? "Salvando..." : "Salvar questão manual"}
            </button>
          </div>
        </form>
      ) : tab === "upload" ? (
        <form onSubmit={gerarPreview} className="mt-6 grid gap-4 rounded-2xl border border-slate-800/80 bg-ink-900/50 p-6">
          <div className="inline-flex rounded-lg bg-ink-950 p-1">
            <button type="button" onClick={() => setImportType("csv")} className={`rounded px-3 py-1.5 text-sm ${importType === "csv" ? "bg-sea-500 text-ink-950" : "text-slate-300"}`}>CSV (recomendado)</button>
            <button type="button" onClick={() => setImportType("pdf")} className={`rounded px-3 py-1.5 text-sm ${importType === "pdf" ? "bg-sea-500 text-ink-950" : "text-slate-300"}`}>PDF</button>
          </div>

          {importType === "csv" ? (
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-500">Arquivo CSV</label>
              <input type="file" accept=".csv,text/csv" required onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)} className="mt-2 block w-full rounded-lg border border-slate-700 bg-ink-950 px-3 py-2 text-sm text-slate-300" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-500">PDF da prova</label>
                  <input type="file" accept="application/pdf" required onChange={(e) => setProvaPdf(e.target.files?.[0] ?? null)} className="mt-2 block w-full rounded-lg border border-slate-700 bg-ink-950 px-3 py-2 text-sm text-slate-300" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-500">PDF do gabarito</label>
                  <input type="file" accept="application/pdf" required onChange={(e) => setGabaritoPdf(e.target.files?.[0] ?? null)} className="mt-2 block w-full rounded-lg border border-slate-700 bg-ink-950 px-3 py-2 text-sm text-slate-300" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <input value={banca} onChange={(e) => setBanca(e.target.value)} className="rounded-lg border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100" placeholder="Banca" />
                <input value={ano} onChange={(e) => setAno(e.target.value)} className="rounded-lg border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100" placeholder="Ano" />
                <input value={fonteProva} onChange={(e) => setFonteProva(e.target.value)} className="rounded-lg border border-slate-700 bg-ink-950 px-3 py-2 text-slate-100" placeholder="Fonte da prova" />
              </div>
            </>
          )}

          {error ? <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p> : null}

          <div>
            <button type="submit" disabled={loading} className="rounded-xl bg-sea-500 px-5 py-2.5 font-semibold text-ink-950 transition hover:bg-sea-400 disabled:opacity-60">
              {loading ? "Gerando preview..." : "Gerar pré-visualização"}
            </button>
          </div>

          {preview ? (
            <div className="rounded-xl border border-slate-700 bg-ink-950/40 p-4 text-sm text-slate-300">
              <p>Última prévia: <strong>{preview.totalExtraidas}</strong> questões extraídas.</p>
              <p className="mt-1 text-xs text-slate-500">Abra a aba de revisão para editar antes de salvar.</p>
            </div>
          ) : null}
        </form>
      ) : (
        <div className="mt-6 space-y-5">
          {!preview ? (
            <p className="text-slate-400">Gere uma pré-visualização primeiro.</p>
          ) : (
            <>
              <div className="rounded-2xl border border-slate-800/80 bg-ink-900/50 p-5">
                <p className="text-sm text-sea-300">Total extraídas: {preview.totalExtraidas}</p>
                <div className="mt-3 space-y-2">
                  {orderedPreview.map(([disc, qtd]) => (
                    <div key={disc} className="flex justify-between text-sm text-slate-300"><span>{disc}</span><span className="font-mono">{qtd}</span></div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {questoesEdit.map((q, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-800/80 bg-ink-900/40 p-4">
                    {q.duplicada ? (
                      <div className="mb-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                        Duplicada: já existe na base com id {q.duplicadaId}. "{q.duplicadaEnunciado}"
                      </div>
                    ) : null}
                    <div className="grid gap-3 sm:grid-cols-3">
                      <input value={q.disciplina ?? ""} onChange={(e) => updateQuestao(idx, "disciplina", e.target.value)} className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-sm text-slate-100" placeholder="Disciplina" />
                      <input value={q.assunto ?? ""} onChange={(e) => updateQuestao(idx, "assunto", e.target.value)} className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-sm text-slate-100" placeholder="Assunto" />
                      <input value={q.gabarito ?? ""} onChange={(e) => updateQuestao(idx, "gabarito", e.target.value.toUpperCase())} className="rounded border border-slate-700 bg-ink-950 px-3 py-2 text-sm text-slate-100" placeholder="Gabarito" />
                    </div>
                    <textarea value={q.enunciado ?? ""} onChange={(e) => updateQuestao(idx, "enunciado", e.target.value)} rows={4} className="mt-3 w-full rounded border border-slate-700 bg-ink-950 px-3 py-2 text-sm text-slate-100" />
                  </div>
                ))}
              </div>

              {error ? <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p> : null}

              <div>
                <button type="button" onClick={confirmar} disabled={loading || !questoesEdit.length} className="rounded-xl bg-sea-500 px-5 py-2.5 font-semibold text-ink-950 transition hover:bg-sea-400 disabled:opacity-60">
                  {loading ? "Salvando..." : "Confirmar e salvar no banco"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {summary ? (
        <div className="mt-8 rounded-2xl border border-sea-500/30 bg-sea-500/5 p-6">
          <h2 className="text-lg font-semibold text-white">Resultado da importação</h2>
          <p className="mt-1 text-sea-300">Total importadas: {summary.totalImportadas}</p>
          <div className="mt-5 space-y-3">
            {orderedSummary.map(([disciplina, qtd]) => (
              <div key={disciplina} className="flex items-center justify-between rounded-lg bg-ink-900/70 px-4 py-2">
                <span className="text-sm text-slate-300">{disciplina}</span>
                <span className="font-mono text-sm text-sea-300">{qtd}</span>
              </div>
            ))}
          </div>
          {summary.avisos?.length ? (
            <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-sm font-medium text-amber-200">Avisos</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-100">
                {summary.avisos.map((a, i) => <li key={`${a}-${i}`}>{a}</li>)}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
