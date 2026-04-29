import type { BlogPost } from "./types";

/**
 * Posts versionados no repositório. Para SEO forte no longo prazo, considere
 * prerender (SSG) ou CMS headless; para MVP e indexação básica, URLs públicas + conteúdo estável já ajudam.
 */
export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "como-estudar-concursos-ti-com-questoes",
    title: "Como estudar concursos de TI com banco de questões",
    description:
      "Estratégia simples para transformar prática em progresso mensurável: filtros, revisão e constância.",
    publishedAt: "2026-04-28",
    body: `## Por que questões importam

Em concursos de **TI**, o padrão de prova costuma repetir temas e estilos de cobrança. Resolver questões com intenção acelera o reconhecimento de padrões.

## Um fluxo que funciona

1. **Escolha um recorte** (disciplina + banca + ano).
2. **Resolva em blocos curtos** (20–40 minutos).
3. **Revise erros no mesmo dia** (15 minutos).

## Métricas simples

Acompanhe taxa de acerto por disciplina. Se cair, reduza volume e volte aos fundamentos.

---

*Este é um post de exemplo — substitua ou adicione novos itens em \`web/src/blog/posts.ts\`.*`,
  },
  {
    slug: "revisao-espacada-flashcards",
    title: "Revisão espaçada com flashcards (sem complicar)",
    description: "Use intervalos curtos para fixar conceitos: 1, 7, 15 e 30 dias.",
    publishedAt: "2026-04-28",
    body: `## O essencial

A revisão espaçada funciona quando você **classifica** cada tentativa (acertou vs errou) e agenda a próxima revisão.

## Regra prática

- **Errou**: volte antes (1 dia).
- **Acertou**: aumente o intervalo.

## Dica

Mantenha cartões pequenos: uma ideia por card.

---

*Post de exemplo para SEO e navegação do blog.*`,
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
