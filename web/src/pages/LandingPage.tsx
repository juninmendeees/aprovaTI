import { Link } from "react-router-dom";
import { PublicSiteHeader } from "../components/PublicSiteHeader";

const plans = [
  {
    name: "Essencial",
    price: "R$ 29",
    period: "/mês",
    desc: "Ideal para começar com foco e constância.",
    features: ["Banco de questões filtráveis", "Dashboard de desempenho", "Suporte por e-mail"],
    cta: "Assinar Essencial",
    highlight: false,
  },
  {
    name: "Pro",
    price: "R$ 59",
    period: "/mês",
    desc: "Mais conteúdo e rotina completa de estudo.",
    features: [
      "Tudo do Essencial",
      "Apostilas e trilhas guiadas",
      "Flashcards ilimitados",
      "Mapas mentais por disciplina",
    ],
    cta: "Assinar Pro",
    highlight: true,
  },
  {
    name: "Premium",
    price: "R$ 99",
    period: "/mês",
    desc: "Experiência máxima para quem vai longe.",
    features: [
      "Tudo do Pro",
      "Simulados cronometrados",
      "Prioridade no suporte",
      "Novidades em primeira mão",
    ],
    cta: "Assinar Premium",
    highlight: false,
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-ink-950 text-slate-200">
      <PublicSiteHeader landingAnchors />

      <section className="relative overflow-hidden border-b border-slate-800/60">
        <div
          className="pointer-events-none absolute inset-0 bg-[size:48px_48px] bg-grid-slate opacity-40"
          aria-hidden
        />
        <div className="pointer-events-none absolute -left-40 top-20 h-80 w-80 rounded-full bg-sea-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 bottom-0 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-20 md:pt-28">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-sea-500/30 bg-sea-500/10 px-3 py-1 text-xs font-medium text-sea-300">
            Concursos de TI — estudo orientado a dados
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl md:leading-tight">
            Prepare-se com questões, métricas e conteúdo na medida certa.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-400">
            A Aprova TI reúne prática de questões, acompanhamento de desempenho e materiais de apoio
            para você evoluir com clareza até o dia da prova.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#planos"
              className="rounded-xl bg-sea-500 px-6 py-3 font-semibold text-ink-950 shadow-lg shadow-sea-500/25 transition hover:bg-sea-400"
            >
              Ver planos de assinatura
            </a>
            <Link
              to="/login"
              className="rounded-xl border border-slate-600 px-6 py-3 font-semibold text-slate-100 transition hover:border-slate-400 hover:bg-slate-800/50"
            >
              Já sou assinante
            </Link>
          </div>
        </div>
      </section>

      <section id="sobre" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-2xl font-semibold text-white md:text-3xl">Por que a plataforma?</h2>
        <p className="mt-3 max-w-2xl text-slate-400">
          Integramos estudo ativo com visão de progresso: você sabe onde erra, onde acerta e o que
          priorizar em cada disciplina.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Prática inteligente",
              body: "Filtre por banca, ano e disciplina. Marque o que já respondeu e foque no que falta.",
            },
            {
              title: "Dashboard real",
              body: "Percentuais e recortes por matéria, conectados às suas respostas na API.",
            },
            {
              title: "Ecossistema em crescimento",
              body: "Apostilas, flashcards e mapas mentais para fechar o ciclo de revisão.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-800/80 bg-ink-900/50 p-6 shadow-xl shadow-black/20"
            >
              <h3 className="text-lg font-semibold text-white">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="planos" className="border-y border-slate-800/60 bg-ink-900/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-semibold text-white md:text-3xl">
            Escolha seu plano de assinatura
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-slate-400">
            Três opções para combinar com seu ritmo. Todos incluem acesso à área logada; os níveis
            superiores liberam mais módulos conforme evoluímos o produto.
          </p>
          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-8 ${
                  plan.highlight
                    ? "border-sea-500/50 bg-gradient-to-b from-sea-500/10 to-ink-900/80 shadow-xl shadow-sea-500/10 ring-1 ring-sea-500/30"
                    : "border-slate-800/80 bg-ink-900/60"
                }`}
              >
                {plan.highlight ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sea-500 px-3 py-0.5 text-xs font-semibold text-ink-950">
                    Mais popular
                  </span>
                ) : null}
                <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                <p className="mt-2 text-sm text-slate-400">{plan.desc}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-slate-500">{plan.period}</span>
                </div>
                <ul className="mt-8 flex-1 space-y-3 text-sm text-slate-300">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-sea-400">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login"
                  className={`mt-10 block w-full rounded-xl py-3 text-center text-sm font-semibold transition ${
                    plan.highlight
                      ? "bg-sea-500 text-ink-950 hover:bg-sea-400"
                      : "border border-slate-600 text-white hover:border-sea-500/50 hover:bg-slate-800/50"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-12 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} Aprova TI — preparação para concursos de tecnologia da informação.</p>
        <p className="mt-2">
          <Link to="/politicas" className="text-slate-400 hover:text-slate-200">
            Consulte nossas políticas de retenção e segurança
          </Link>
        </p>
      </footer>
    </div>
  );
}
