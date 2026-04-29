type EnunciadoFormatadoProps = {
  texto: string;
};

type Bloco = {
  tipo: "texto" | "codigo";
  conteudo: string;
};

function isLikelyCodeLine(linha: string): boolean {
  const l = linha.trim();
  if (!l) return false;
  if (l.startsWith("```") || l.endsWith("```")) return true;

  // Prioriza reconhecimento de linhas de SQL/código, sem "capturar" parágrafos comuns.
  const keywordPattern =
    /^(select|from|where|group\s+by|having|order\s+by|insert|update|delete|join|inner\s+join|left\s+join|right\s+join|if|for|while|return|class|function|public|private|const|let|var|@[\w.]+)/i;

  if (keywordPattern.test(l)) {
    return true;
  }

  const symbolCount = (l.match(/[{}();=<>]/g) ?? []).length;
  const alphaCount = (l.match(/[A-Za-zÀ-ÿ]/g) ?? []).length;
  if (symbolCount >= 3 && alphaCount > 0) {
    return true;
  }

  // Linha fortemente "técnica", normalmente SQL/expressão.
  if (/\b(count|distinct|sum|max|min|avg)\s*\(/i.test(l)) {
    return true;
  }

  return false;
}

function splitIntoBlocks(texto: string): Bloco[] {
  const linhas = texto.replace(/\r\n/g, "\n").split("\n");
  const blocos: Bloco[] = [];

  let atualTipo: Bloco["tipo"] | null = null;
  let atualLinhas: string[] = [];

  function flush() {
    if (!atualTipo || atualLinhas.length === 0) return;
    const conteudo = atualLinhas.join("\n").trimEnd();
    if (conteudo.trim()) {
      blocos.push({ tipo: atualTipo, conteudo });
    }
    atualTipo = null;
    atualLinhas = [];
  }

  for (const linha of linhas) {
    const vazia = linha.trim().length === 0;
    const tipoLinha: Bloco["tipo"] = isLikelyCodeLine(linha) ? "codigo" : "texto";

    if (vazia) {
      // Em branco separa blocos para manter respiração do enunciado.
      flush();
      continue;
    }

    if (!atualTipo) {
      atualTipo = tipoLinha;
      atualLinhas = [linha];
      continue;
    }

    if (atualTipo === tipoLinha) {
      atualLinhas.push(linha);
    } else {
      flush();
      atualTipo = tipoLinha;
      atualLinhas = [linha];
    }
  }

  flush();
  return blocos;
}

export function EnunciadoFormatado({ texto }: EnunciadoFormatadoProps) {
  const blocos = splitIntoBlocks(texto);
  const isLong = texto.length > 900 || blocos.length > 7;

  const content = (
    <div className="space-y-3">
      {blocos.length === 0 ? (
        <p className="whitespace-pre-wrap leading-relaxed text-slate-100">{texto}</p>
      ) : (
        blocos.map((bloco, idx) =>
          bloco.tipo === "codigo" ? (
            <pre
              key={idx}
              className="overflow-x-auto rounded-lg border border-slate-700 bg-ink-950/80 p-3 text-xs leading-6 text-slate-200"
            >
              <code>{bloco.conteudo}</code>
            </pre>
          ) : (
            <p key={idx} className="whitespace-pre-wrap break-words leading-relaxed text-slate-100">
              {bloco.conteudo}
            </p>
          )
        )
      )}
    </div>
  );

  if (!isLong) {
    return content;
  }

  return (
    <details className="group">
      <summary className="mb-3 cursor-pointer list-none text-xs font-medium text-sea-300 hover:text-sea-200">
        <span className="group-open:hidden">Expandir enunciado completo</span>
        <span className="hidden group-open:inline">Recolher enunciado</span>
      </summary>
      <div className="max-h-[28rem] overflow-auto pr-1">{content}</div>
    </details>
  );
}
