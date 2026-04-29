import type {
  AuthResponse,
  ApostilaProgressoResponse,
  ApostilaDisciplinaCatalogo,
  DashboardResponse,
  DuplicateCheckResponse,
  ImportedQuestaoDTO,
  ImportPreviewResponse,
  ImportSummaryResponse,
  QuestaoResponseDTO,
  QuestaoFiltroOpcoesResponse,
  RespostaResponseDTO,
  PoliticasResponse,
  FlashcardDTO,
  FlashcardReviewResult,
  MapaMentalDTO,
  BillingStatusResponse,
} from "../types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const SESSION_EXPIRED_EVENT = "aprovati:session-expired";
const SUBSCRIPTION_REQUIRED_EVENT = "aprovati:subscription-required";

function withBase(path: string): string {
  if (!API_BASE) return path;
  return `${API_BASE}${path}`;
}

function authHeader(token?: string): HeadersInit {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    throw new Error(res.statusText || "Resposta vazia");
  }
  return JSON.parse(text) as T;
}

async function parseError(res: Response): Promise<{ message: string; code?: string }> {
  const raw = await res.text().catch(() => "");
  let msg = raw || `Falha na operação (${res.status})`;
  let code: string | undefined;
  try {
    const j = JSON.parse(raw) as {
      detail?: string;
      title?: string;
      message?: string;
      mensagem?: string;
      code?: string;
    };
    msg = j.detail || j.title || j.message || j.mensagem || msg;
    code = j.code;
  } catch {
    // plain text
  }
  return { message: msg, code };
}

async function ensureOk(res: Response): Promise<void> {
  if (res.ok) return;
  const parsed = await parseError(res);
  if (res.status === 401 || res.status === 403) {
    window.dispatchEvent(
      new CustomEvent(SESSION_EXPIRED_EVENT, {
        detail: { status: res.status },
      })
    );
  }
  if (res.status === 402) {
    window.dispatchEvent(
      new CustomEvent(SUBSCRIPTION_REQUIRED_EVENT, {
        detail: { status: res.status, code: parsed.code, message: parsed.message },
      })
    );
  }
  throw new Error(parsed.message);
}

export async function loginRequest(email: string, senha: string): Promise<AuthResponse> {
  const res = await fetch(withBase("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });
  await ensureOk(res);
  return parseJson<AuthResponse>(res);
}

export async function registerRequest(nome: string, email: string, senha: string): Promise<AuthResponse> {
  const res = await fetch(withBase("/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, email, senha }),
  });
  await ensureOk(res);
  return parseJson<AuthResponse>(res);
}

export async function fetchDashboard(token: string): Promise<DashboardResponse> {
  const res = await fetch(withBase("/dashboard/me"), { headers: authHeader(token) });
  await ensureOk(res);
  return parseJson<DashboardResponse>(res);
}

export async function fetchQuestoes(
  params: {
    disciplina?: string;
    ano?: number;
    banca?: string;
    assunto?: string;
    questaoId?: number;
    cargoFuncao?: string;
    naoRespondidas?: boolean;
    somenteErrei?: boolean;
    limite?: number;
    ordemAleatoria?: boolean;
  },
  token: string
): Promise<QuestaoResponseDTO[]> {
  const sp = new URLSearchParams();
  if (params.disciplina) sp.set("disciplina", params.disciplina);
  if (params.ano) sp.set("ano", String(params.ano));
  if (params.banca) sp.set("banca", params.banca);
  if (params.assunto) sp.set("assunto", params.assunto);
  if (params.questaoId) sp.set("questaoId", String(params.questaoId));
  if (params.cargoFuncao) sp.set("cargoFuncao", params.cargoFuncao);
  if (params.naoRespondidas) sp.set("naoRespondidas", "true");
  if (params.somenteErrei) sp.set("somenteErrei", "true");
  if (params.limite) sp.set("limite", String(params.limite));
  if (params.ordemAleatoria) sp.set("ordemAleatoria", "true");
  const res = await fetch(withBase(`/questoes?${sp.toString()}`), { headers: authHeader(token) });
  await ensureOk(res);
  return parseJson<QuestaoResponseDTO[]>(res);
}

export async function fetchQuestaoFiltroOpcoes(token: string): Promise<QuestaoFiltroOpcoesResponse> {
  const res = await fetch(withBase("/questoes/filtros/opcoes"), { headers: authHeader(token) });
  await ensureOk(res);
  return parseJson<QuestaoFiltroOpcoesResponse>(res);
}

export async function enviarResposta(
  body: { questaoId: number; resposta: string },
  token: string
): Promise<RespostaResponseDTO> {
  const res = await fetch(withBase("/respostas"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(authHeader(token) as Record<string, string>) },
    body: JSON.stringify(body),
  });
  await ensureOk(res);
  return parseJson<RespostaResponseDTO>(res);
}

export async function previewImportacaoAdmin(
  token: string,
  payload: {
    provaPdf: File;
    gabaritoPdf: File;
    banca?: string;
    ano?: number;
    fonteProva?: string;
  }
): Promise<ImportPreviewResponse> {
  const formData = new FormData();
  formData.append("provaPdf", payload.provaPdf);
  formData.append("gabaritoPdf", payload.gabaritoPdf);
  if (payload.banca) formData.append("banca", payload.banca);
  if (payload.ano) formData.append("ano", String(payload.ano));
  if (payload.fonteProva) formData.append("fonteProva", payload.fonteProva);

  const res = await fetch(withBase("/admin/importacoes/provas/preview"), {
    method: "POST",
    headers: authHeader(token),
    body: formData,
  });

  await ensureOk(res);
  return parseJson<ImportPreviewResponse>(res);
}

export async function previewImportacaoCsvAdmin(
  token: string,
  csvFile: File
): Promise<ImportPreviewResponse> {
  const formData = new FormData();
  formData.append("csvFile", csvFile);

  const res = await fetch(withBase("/admin/importacoes/csv/preview"), {
    method: "POST",
    headers: authHeader(token),
    body: formData,
  });

  await ensureOk(res);
  return parseJson<ImportPreviewResponse>(res);
}

export async function confirmarImportacaoAdmin(
  token: string,
  questoes: ImportedQuestaoDTO[],
  permitirDuplicadas = false
): Promise<ImportSummaryResponse> {
  const res = await fetch(withBase("/admin/importacoes/provas/confirm"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(authHeader(token) as Record<string, string>) },
    body: JSON.stringify({ questoes, permitirDuplicadas }),
  });

  await ensureOk(res);
  return parseJson<ImportSummaryResponse>(res);
}

export async function validarDuplicidadeQuestaoAdmin(
  token: string,
  questao: ImportedQuestaoDTO
): Promise<DuplicateCheckResponse> {
  const res = await fetch(withBase("/admin/questoes/validar-duplicidade"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(authHeader(token) as Record<string, string>) },
    body: JSON.stringify(questao),
  });
  await ensureOk(res);
  return parseJson<DuplicateCheckResponse>(res);
}

export async function criarQuestaoManualAdmin(
  token: string,
  questao: ImportedQuestaoDTO,
  confirmarDuplicada = false
): Promise<{ id: number; mensagem: string }> {
  const res = await fetch(withBase("/admin/questoes/manual"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(authHeader(token) as Record<string, string>) },
    body: JSON.stringify({ questao, confirmarDuplicada }),
  });
  await ensureOk(res);
  return parseJson<{ id: number; mensagem: string }>(res);
}

export async function fetchApostilasProgresso(token: string): Promise<ApostilaProgressoResponse[]> {
  const res = await fetch(withBase("/apostilas/progresso"), {
    headers: authHeader(token),
  });
  await ensureOk(res);
  return parseJson<ApostilaProgressoResponse[]>(res);
}

export async function salvarApostilaProgresso(
  token: string,
  payload: ApostilaProgressoResponse
): Promise<ApostilaProgressoResponse> {
  const res = await fetch(withBase(`/apostilas/progresso/${encodeURIComponent(payload.pdfId)}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(authHeader(token) as Record<string, string>) },
    body: JSON.stringify(payload),
  });
  await ensureOk(res);
  return parseJson<ApostilaProgressoResponse>(res);
}

export async function fetchApostilasCatalogo(token: string): Promise<ApostilaDisciplinaCatalogo[]> {
  const res = await fetch(withBase("/apostilas/catalogo"), {
    headers: authHeader(token),
  });
  await ensureOk(res);
  return parseJson<ApostilaDisciplinaCatalogo[]>(res);
}

export async function adminListarApostilasCatalogo(token: string): Promise<ApostilaDisciplinaCatalogo[]> {
  const res = await fetch(withBase("/admin/apostilas/catalogo"), { headers: authHeader(token) });
  await ensureOk(res);
  return parseJson<ApostilaDisciplinaCatalogo[]>(res);
}

export async function adminListarDisciplinasSugestaoApostila(token: string): Promise<string[]> {
  const res = await fetch(withBase("/admin/apostilas/sugestoes/disciplinas"), {
    headers: authHeader(token),
  });
  await ensureOk(res);
  return parseJson<string[]>(res);
}

export async function adminCriarDisciplinaApostila(
  token: string,
  nome: string
): Promise<ApostilaDisciplinaCatalogo[]> {
  const res = await fetch(withBase("/admin/apostilas/disciplinas"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(authHeader(token) as Record<string, string>) },
    body: JSON.stringify({ nome }),
  });
  await ensureOk(res);
  return parseJson<ApostilaDisciplinaCatalogo[]>(res);
}

export async function adminRemoverDisciplinaApostila(
  token: string,
  disciplinaId: number
): Promise<ApostilaDisciplinaCatalogo[]> {
  const res = await fetch(withBase(`/admin/apostilas/disciplinas/${disciplinaId}`), {
    method: "DELETE",
    headers: authHeader(token),
  });
  await ensureOk(res);
  return parseJson<ApostilaDisciplinaCatalogo[]>(res);
}

export async function adminCriarAssuntoApostila(
  token: string,
  disciplinaId: number,
  nome: string
): Promise<ApostilaDisciplinaCatalogo[]> {
  const res = await fetch(withBase("/admin/apostilas/assuntos"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(authHeader(token) as Record<string, string>) },
    body: JSON.stringify({ disciplinaId, nome }),
  });
  await ensureOk(res);
  return parseJson<ApostilaDisciplinaCatalogo[]>(res);
}

export async function adminRemoverAssuntoApostila(
  token: string,
  assuntoId: number
): Promise<ApostilaDisciplinaCatalogo[]> {
  const res = await fetch(withBase(`/admin/apostilas/assuntos/${assuntoId}`), {
    method: "DELETE",
    headers: authHeader(token),
  });
  await ensureOk(res);
  return parseJson<ApostilaDisciplinaCatalogo[]>(res);
}

export async function adminCriarArquivoApostila(
  token: string,
  payload: { assuntoId: number; titulo: string; url: string; paginas?: number }
): Promise<ApostilaDisciplinaCatalogo[]> {
  const res = await fetch(withBase("/admin/apostilas/arquivos"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(authHeader(token) as Record<string, string>) },
    body: JSON.stringify(payload),
  });
  await ensureOk(res);
  return parseJson<ApostilaDisciplinaCatalogo[]>(res);
}

export async function adminUploadArquivoApostila(
  token: string,
  payload: { assuntoId: number; titulo: string; paginas?: number; arquivoPdf: File }
): Promise<ApostilaDisciplinaCatalogo[]> {
  const formData = new FormData();
  formData.append("assuntoId", String(payload.assuntoId));
  formData.append("titulo", payload.titulo);
  if (payload.paginas) formData.append("paginas", String(payload.paginas));
  formData.append("arquivoPdf", payload.arquivoPdf);

  const res = await fetch(withBase("/admin/apostilas/arquivos/upload"), {
    method: "POST",
    headers: authHeader(token),
    body: formData,
  });
  await ensureOk(res);
  return parseJson<ApostilaDisciplinaCatalogo[]>(res);
}

export async function adminAtualizarArquivoApostila(
  token: string,
  arquivoId: number,
  payload: { titulo: string; url: string; paginas?: number }
): Promise<ApostilaDisciplinaCatalogo[]> {
  const res = await fetch(withBase(`/admin/apostilas/arquivos/${arquivoId}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(authHeader(token) as Record<string, string>) },
    body: JSON.stringify(payload),
  });
  await ensureOk(res);
  return parseJson<ApostilaDisciplinaCatalogo[]>(res);
}

export async function adminRemoverArquivoApostila(
  token: string,
  arquivoId: number
): Promise<ApostilaDisciplinaCatalogo[]> {
  const res = await fetch(withBase(`/admin/apostilas/arquivos/${arquivoId}`), {
    method: "DELETE",
    headers: authHeader(token),
  });
  if (!res.ok) {
    const parsed = await parseError(res);
    throw new Error(parsed.message);
  }
  return parseJson<ApostilaDisciplinaCatalogo[]>(res);
}

export async function fetchPoliticasPublicas(): Promise<PoliticasResponse> {
  const res = await fetch(withBase("/politicas"));
  await ensureOk(res);
  return parseJson<PoliticasResponse>(res);
}

export async function fetchFlashcardsDisciplinas(token: string): Promise<string[]> {
  const res = await fetch(withBase("/flashcards/disciplinas"), { headers: authHeader(token) });
  await ensureOk(res);
  return parseJson<string[]>(res);
}

export async function fetchFlashcards(
  token: string,
  params?: { disciplina?: string; origem?: "PADRAO" | "PESSOAL" | "TODOS" }
): Promise<FlashcardDTO[]> {
  const sp = new URLSearchParams();
  if (params?.disciplina) sp.set("disciplina", params.disciplina);
  if (params?.origem && params.origem !== "TODOS") sp.set("origem", params.origem);
  const suffix = sp.toString() ? `?${sp.toString()}` : "";
  const res = await fetch(withBase(`/flashcards${suffix}`), { headers: authHeader(token) });
  await ensureOk(res);
  return parseJson<FlashcardDTO[]>(res);
}

export async function fetchFlashcardsPendentes(
  token: string,
  params?: { disciplina?: string; origem?: "PADRAO" | "PESSOAL" | "TODOS" }
): Promise<FlashcardDTO[]> {
  const sp = new URLSearchParams();
  if (params?.disciplina) sp.set("disciplina", params.disciplina);
  if (params?.origem && params.origem !== "TODOS") sp.set("origem", params.origem);
  const suffix = sp.toString() ? `?${sp.toString()}` : "";
  const res = await fetch(withBase(`/flashcards/revisao/pendentes${suffix}`), { headers: authHeader(token) });
  await ensureOk(res);
  return parseJson<FlashcardDTO[]>(res);
}

export async function criarFlashcardPessoal(
  token: string,
  payload: { disciplina: string; frente: string; verso: string; imagem?: File | null }
): Promise<FlashcardDTO> {
  const formData = new FormData();
  formData.append("disciplina", payload.disciplina);
  formData.append("frente", payload.frente);
  formData.append("verso", payload.verso);
  if (payload.imagem) formData.append("imagem", payload.imagem);
  const res = await fetch(withBase("/flashcards"), {
    method: "POST",
    headers: authHeader(token),
    body: formData,
  });
  await ensureOk(res);
  return parseJson<FlashcardDTO>(res);
}

export async function criarFlashcardPadraoAdmin(
  token: string,
  payload: { disciplina: string; frente: string; verso: string; imagem?: File | null }
): Promise<FlashcardDTO> {
  const formData = new FormData();
  formData.append("disciplina", payload.disciplina);
  formData.append("frente", payload.frente);
  formData.append("verso", payload.verso);
  if (payload.imagem) formData.append("imagem", payload.imagem);
  const res = await fetch(withBase("/admin/flashcards"), {
    method: "POST",
    headers: authHeader(token),
    body: formData,
  });
  await ensureOk(res);
  return parseJson<FlashcardDTO>(res);
}

export async function adminListarFlashcardsPadrao(
  token: string,
  params?: { disciplina?: string }
): Promise<FlashcardDTO[]> {
  const sp = new URLSearchParams();
  if (params?.disciplina) sp.set("disciplina", params.disciplina);
  const suffix = sp.toString() ? `?${sp.toString()}` : "";
  const res = await fetch(withBase(`/admin/flashcards${suffix}`), { headers: authHeader(token) });
  await ensureOk(res);
  return parseJson<FlashcardDTO[]>(res);
}

export async function adminAtualizarFlashcardPadrao(
  token: string,
  flashcardId: number,
  payload: { disciplina: string; frente: string; verso: string; imagem?: File | null }
): Promise<FlashcardDTO> {
  const formData = new FormData();
  formData.append("disciplina", payload.disciplina);
  formData.append("frente", payload.frente);
  formData.append("verso", payload.verso);
  if (payload.imagem) formData.append("imagem", payload.imagem);
  const res = await fetch(withBase(`/admin/flashcards/${flashcardId}`), {
    method: "PUT",
    headers: authHeader(token),
    body: formData,
  });
  await ensureOk(res);
  return parseJson<FlashcardDTO>(res);
}

export async function adminRemoverFlashcardPadrao(token: string, flashcardId: number): Promise<void> {
  const res = await fetch(withBase(`/admin/flashcards/${flashcardId}`), {
    method: "DELETE",
    headers: authHeader(token),
  });
  await ensureOk(res);
}

export async function removerFlashcardPessoal(token: string, flashcardId: number): Promise<void> {
  const res = await fetch(withBase(`/flashcards/${flashcardId}`), {
    method: "DELETE",
    headers: authHeader(token),
  });
  await ensureOk(res);
}

export async function revisarFlashcard(
  token: string,
  flashcardId: number,
  resultado: FlashcardReviewResult
): Promise<FlashcardDTO> {
  const res = await fetch(withBase(`/flashcards/${flashcardId}/revisao`), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(authHeader(token) as Record<string, string>) },
    body: JSON.stringify({ resultado }),
  });
  await ensureOk(res);
  return parseJson<FlashcardDTO>(res);
}

export async function fetchMapasMentaisDisciplinas(token: string): Promise<string[]> {
  const res = await fetch(withBase("/mapas-mentais/disciplinas"), { headers: authHeader(token) });
  await ensureOk(res);
  return parseJson<string[]>(res);
}

export async function fetchMapasMentais(
  token: string,
  params?: { disciplina?: string; assunto?: string }
): Promise<MapaMentalDTO[]> {
  const sp = new URLSearchParams();
  if (params?.disciplina) sp.set("disciplina", params.disciplina);
  if (params?.assunto) sp.set("assunto", params.assunto);
  const suffix = sp.toString() ? `?${sp.toString()}` : "";
  const res = await fetch(withBase(`/mapas-mentais${suffix}`), { headers: authHeader(token) });
  await ensureOk(res);
  return parseJson<MapaMentalDTO[]>(res);
}

export async function adminListarMapasMentais(
  token: string,
  params?: { disciplina?: string; assunto?: string }
): Promise<MapaMentalDTO[]> {
  const sp = new URLSearchParams();
  if (params?.disciplina) sp.set("disciplina", params.disciplina);
  if (params?.assunto) sp.set("assunto", params.assunto);
  const suffix = sp.toString() ? `?${sp.toString()}` : "";
  const res = await fetch(withBase(`/admin/mapas-mentais${suffix}`), { headers: authHeader(token) });
  await ensureOk(res);
  return parseJson<MapaMentalDTO[]>(res);
}

export async function adminCriarMapaMental(
  token: string,
  payload: { disciplina: string; assunto: string; titulo: string; imagem: File }
): Promise<MapaMentalDTO> {
  const formData = new FormData();
  formData.append("disciplina", payload.disciplina);
  formData.append("assunto", payload.assunto);
  formData.append("titulo", payload.titulo);
  formData.append("imagem", payload.imagem);
  const res = await fetch(withBase("/admin/mapas-mentais"), {
    method: "POST",
    headers: authHeader(token),
    body: formData,
  });
  await ensureOk(res);
  return parseJson<MapaMentalDTO>(res);
}

export async function adminAtualizarMapaMental(
  token: string,
  mapaId: number,
  payload: { disciplina: string; assunto: string; titulo: string; imagem?: File | null }
): Promise<MapaMentalDTO> {
  const formData = new FormData();
  formData.append("disciplina", payload.disciplina);
  formData.append("assunto", payload.assunto);
  formData.append("titulo", payload.titulo);
  if (payload.imagem) formData.append("imagem", payload.imagem);
  const res = await fetch(withBase(`/admin/mapas-mentais/${mapaId}`), {
    method: "PUT",
    headers: authHeader(token),
    body: formData,
  });
  await ensureOk(res);
  return parseJson<MapaMentalDTO>(res);
}

export async function adminRemoverMapaMental(token: string, mapaId: number): Promise<void> {
  const res = await fetch(withBase(`/admin/mapas-mentais/${mapaId}`), {
    method: "DELETE",
    headers: authHeader(token),
  });
  await ensureOk(res);
}

export async function fetchMinhaAssinatura(token: string): Promise<BillingStatusResponse> {
  const res = await fetch(withBase("/billing/me"), { headers: authHeader(token) });
  await ensureOk(res);
  return parseJson<BillingStatusResponse>(res);
}

export async function criarCheckoutAssinatura(
  token: string,
  planCode:
    | "ESSENCIAL_MENSAL"
    | "ESSENCIAL_ANUAL"
    | "PRO_MENSAL"
    | "PRO_ANUAL"
    | "PREMIUM_MENSAL"
    | "PREMIUM_ANUAL"
): Promise<{ checkoutUrl: string }> {
  const res = await fetch(withBase("/billing/checkout-session"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(authHeader(token) as Record<string, string>) },
    body: JSON.stringify({ planCode }),
  });
  await ensureOk(res);
  return parseJson<{ checkoutUrl: string }>(res);
}

export async function criarPortalAssinatura(token: string): Promise<{ portalUrl: string }> {
  const res = await fetch(withBase("/billing/portal-session"), {
    method: "POST",
    headers: authHeader(token),
  });
  await ensureOk(res);
  return parseJson<{ portalUrl: string }>(res);
}

export async function cancelarAssinatura(token: string): Promise<void> {
  const res = await fetch(withBase("/billing/cancel"), {
    method: "POST",
    headers: authHeader(token),
  });
  await ensureOk(res);
}

export async function reativarAssinatura(token: string): Promise<void> {
  const res = await fetch(withBase("/billing/reactivate"), {
    method: "POST",
    headers: authHeader(token),
  });
  await ensureOk(res);
}
