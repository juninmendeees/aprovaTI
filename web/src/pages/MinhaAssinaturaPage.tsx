import { useEffect, useState } from "react";
import {
  cancelarAssinatura,
  criarCheckoutAssinatura,
  criarPortalAssinatura,
  fetchMinhaAssinatura,
  reativarAssinatura,
} from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { BillingStatusResponse } from "../types";

const plans = [
  { code: "ESSENCIAL_MENSAL" as const, name: "Essencial Mensal", price: "R$ 29/mês" },
  { code: "ESSENCIAL_ANUAL" as const, name: "Essencial Anual", price: "R$ 290/ano" },
  { code: "PRO_MENSAL" as const, name: "Pro Mensal", price: "R$ 59/mês" },
  { code: "PRO_ANUAL" as const, name: "Pro Anual", price: "R$ 590/ano" },
  { code: "PREMIUM_MENSAL" as const, name: "Premium Mensal", price: "R$ 99/mês" },
  { code: "PREMIUM_ANUAL" as const, name: "Premium Anual", price: "R$ 990/ano" },
];

export function MinhaAssinaturaPage() {
  const { token, auth } = useAuth();
  const [data, setData] = useState<BillingStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function carregar() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchMinhaAssinatura(token);
      setData(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar assinatura.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, [token]);

  async function assinar(
    planCode:
      | "ESSENCIAL_MENSAL"
      | "ESSENCIAL_ANUAL"
      | "PRO_MENSAL"
      | "PRO_ANUAL"
      | "PREMIUM_MENSAL"
      | "PREMIUM_ANUAL"
  ) {
    if (!token) return;
    setError(null);
    try {
      const response = await criarCheckoutAssinatura(token, planCode);
      window.location.assign(response.checkoutUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao iniciar checkout.");
    }
  }

  async function abrirPortal() {
    if (!token) return;
    setError(null);
    try {
      const response = await criarPortalAssinatura(token);
      window.location.assign(response.portalUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao abrir portal de cobrança.");
    }
  }

  async function cancelar() {
    if (!token) return;
    if (!window.confirm("Deseja cancelar no fim do ciclo atual?")) return;
    await cancelarAssinatura(token);
    await carregar();
  }

  async function reativar() {
    if (!token) return;
    await reativarAssinatura(token);
    await carregar();
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-800/80 bg-ink-900/60 p-6">
        <h1 className="text-2xl font-semibold text-white">Minha Assinatura</h1>
        <p className="mt-2 text-sm text-slate-400">
          Gerencie sua assinatura, upgrade/downgrade e cancelamento.
        </p>
        <p className="mt-1 text-xs text-slate-500">{auth?.email}</p>
      </header>

      {error ? <p className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-500">Carregando assinatura...</p> : null}

      {data ? (
        <section className="rounded-2xl border border-slate-800/80 bg-ink-900/50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Status atual</p>
          <p className="mt-1 text-lg font-semibold text-white">{data.status}</p>
          <p className="mt-1 text-sm text-slate-400">Plano: {data.planCode ?? "Sem plano"}</p>
          <p className="text-sm text-slate-400">
            Período atual até: {data.currentPeriodEndsAt ? new Date(data.currentPeriodEndsAt).toLocaleDateString("pt-BR") : "-"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void abrirPortal()}
              className="rounded border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800"
            >
              Abrir portal de cobrança
            </button>
            <button
              type="button"
              onClick={() => void cancelar()}
              className="rounded border border-red-500/40 px-3 py-2 text-xs text-red-200 hover:bg-red-500/10"
            >
              Cancelar no fim do período
            </button>
            <button
              type="button"
              onClick={() => void reativar()}
              className="rounded border border-sea-500/40 px-3 py-2 text-xs text-sea-200 hover:bg-sea-500/10"
            >
              Reativar assinatura
            </button>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.code} className="rounded-2xl border border-slate-800/80 bg-ink-900/50 p-4">
            <p className="text-lg font-semibold text-white">{plan.name}</p>
            <p className="mt-1 text-sm text-slate-400">{plan.price}</p>
            <button
              type="button"
              onClick={() => void assinar(plan.code)}
              className="mt-4 w-full rounded-lg bg-sea-500 px-3 py-2 text-sm font-semibold text-ink-950 hover:bg-sea-400"
            >
              Assinar {plan.name}
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
