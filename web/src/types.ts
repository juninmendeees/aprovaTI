export type AuthResponse = {
  accessToken: string;
  tokenType: string;
  id: number;
  nome: string;
  email: string;
  role: "ADMIN" | "USER";
  subscriptionStatus?: "NONE" | "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE";
  subscriptionPlanCode?: string | null;
  subscriptionTrialEndsAt?: string | null;
  subscriptionCurrentPeriodEndsAt?: string | null;
};

export type DashboardResponse = {
  total: number;
  acertos: number;
  percentual: number;
  disciplinas: {
    disciplina: string;
    total: number;
    acertos: number;
    percentual: number;
  }[];
};

export type AlternativaDTO = {
  letra: string;
  texto: string;
};

export type QuestaoResponseDTO = {
  id: number;
  enunciado: string;
  ano: number;
  banca: string;
  disciplina: string;
  assunto: string;
  cargoFuncao?: string;
  gabarito: string;
  alternativas: AlternativaDTO[];
};

export type QuestaoFiltroOpcoesResponse = {
  disciplinas: string[];
  bancas: string[];
};

export type RespostaResponseDTO = {
  id: number;
  respostaMarcada: string;
  correta: boolean;
  dataResposta: string;
  usuarioId: number;
  questaoId: number;
};

export type ImportedQuestaoDTO = {
  enunciado: string;
  ano: number | null;
  banca: string;
  disciplina: string;
  assunto: string;
  cargoFuncao?: string;
  gabarito: "A" | "B" | "C" | "D" | "E" | string;
  fonteProva: string;
  duplicada?: boolean;
  duplicadaId?: number | null;
  duplicadaEnunciado?: string | null;
  alternativas: AlternativaDTO[];
};

export type ImportPreviewResponse = {
  totalExtraidas: number;
  porAssunto: Record<string, number>;
  avisos: string[];
  questoes: ImportedQuestaoDTO[];
};

export type ImportSummaryResponse = {
  totalImportadas: number;
  porAssunto: Record<string, number>;
  avisos: string[];
};

export type DuplicateCheckResponse = {
  duplicada: boolean;
  idQuestao?: number | null;
  enunciado?: string | null;
};

export type ApostilaHighlight = {
  id: string;
  texto: string;
  cor: "yellow" | "green" | "blue" | "pink";
  createdAt: string;
  areas?: {
    pageIndex: number;
    top: number;
    left: number;
    width: number;
    height: number;
  }[];
};

export type ApostilaProgressoResponse = {
  pdfId: string;
  concluido: boolean;
  anotacoes: string;
  grifos: ApostilaHighlight[];
  ultimaPagina?: number | null;
};

export type PoliticasResponse = {
  retencao: {
    auditoriaDias: number;
    logsAplicacaoDias: number;
    dadosEstudo: string;
    exclusaoSolicitadaDias: number;
  };
  baseLegal: string;
  praticas: string[];
};

export type ApostilaArquivoCatalogo = {
  id: number;
  titulo: string;
  url: string;
  paginas?: number | null;
};

export type ApostilaAssuntoCatalogo = {
  id: number;
  assunto: string;
  arquivos: ApostilaArquivoCatalogo[];
};

export type ApostilaDisciplinaCatalogo = {
  id: number;
  disciplina: string;
  trilhas: ApostilaAssuntoCatalogo[];
};

export type FlashcardOrigem = "PADRAO" | "PESSOAL";
export type FlashcardReviewResult = "ERREI" | "ACERTEI";

export type FlashcardDTO = {
  id: number;
  disciplina: string;
  frente: string;
  verso: string;
  origem: FlashcardOrigem;
  ownerUsuarioId?: number | null;
  imagemDataUrl?: string | null;
  etapaRevisao: number;
  intervaloDias: number;
  proximaRevisao: string;
  ultimaRevisao?: string | null;
  totalRevisoes: number;
  pendenteHoje: boolean;
};

export type MapaMentalDTO = {
  id: number;
  disciplina: string;
  assunto: string;
  titulo: string;
  imagemDataUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BillingStatusResponse = {
  customerId?: string | null;
  subscriptionId?: string | null;
  status: "NONE" | "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE";
  planCode?: string | null;
  trialEndsAt?: string | null;
  currentPeriodEndsAt?: string | null;
  requiresSubscription: boolean;
  canAccessApp: boolean;
};
