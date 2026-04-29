import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navCls =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-800/80 hover:text-slate-100";

const activeCls = "bg-sea-500/15 text-sea-400 ring-1 ring-sea-500/30";

export function AppShell() {
  const { auth, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [subscriptionModal, setSubscriptionModal] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

  useEffect(() => {
    function onSubscriptionRequired(event: Event) {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      setSubscriptionModal({
        open: true,
        message: detail?.message || "Assinatura necessária para continuar.",
      });
    }
    window.addEventListener("aprovati:subscription-required", onSubscriptionRequired);
    return () => window.removeEventListener("aprovati:subscription-required", onSubscriptionRequired);
  }, []);

  return (
    <div className="flex min-h-screen bg-ink-950">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-slate-800/80 bg-ink-900/95 px-3 py-6 backdrop-blur">
        <div className="mb-8 px-2">
          <div className="font-semibold tracking-tight text-white">Aprova TI</div>
          <p className="mt-1 truncate text-xs text-slate-500">{auth?.email}</p>
          <p className="mt-1 text-[11px] uppercase tracking-wider text-sea-400/80">{auth?.role}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          <NavLink to="/app/dashboard" className={({ isActive }) => `${navCls} ${isActive ? activeCls : ""}`}>
            <span className="text-lg leading-none">◆</span>
            Dashboard
          </NavLink>
          <NavLink to="/app/questoes" className={({ isActive }) => `${navCls} ${isActive ? activeCls : ""}`}>
            <span className="text-lg leading-none">◇</span>
            Questões
          </NavLink>
          <NavLink to="/app/apostilas" className={({ isActive }) => `${navCls} ${isActive ? activeCls : ""}`}>
            <span className="text-lg leading-none">▣</span>
            Apostilas
          </NavLink>
          <NavLink to="/app/flashcards" className={({ isActive }) => `${navCls} ${isActive ? activeCls : ""}`}>
            <span className="text-lg leading-none">▤</span>
            Flashcards
          </NavLink>
          <NavLink to="/app/mapas-mentais" className={({ isActive }) => `${navCls} ${isActive ? activeCls : ""}`}>
            <span className="text-lg leading-none">◎</span>
            Mapas mentais
          </NavLink>
          <NavLink to="/app/minha-assinatura" className={({ isActive }) => `${navCls} ${isActive ? activeCls : ""}`}>
            <span className="text-lg leading-none">💳</span>
            Minha assinatura
          </NavLink>
          {isAdmin ? (
            <>
              <NavLink to="/app/admin/importacao" className={({ isActive }) => `${navCls} ${isActive ? activeCls : ""}`}>
                <span className="text-lg leading-none">⚙</span>
                Admin Importação
              </NavLink>
              <NavLink to="/app/admin/apostilas" className={({ isActive }) => `${navCls} ${isActive ? activeCls : ""}`}>
                <span className="text-lg leading-none">🗂</span>
                Admin Apostilas
              </NavLink>
              <NavLink to="/app/admin/flashcards" className={({ isActive }) => `${navCls} ${isActive ? activeCls : ""}`}>
                <span className="text-lg leading-none">🧠</span>
                Admin Flashcards
              </NavLink>
              <NavLink to="/app/admin/mapas-mentais" className={({ isActive }) => `${navCls} ${isActive ? activeCls : ""}`}>
                <span className="text-lg leading-none">🗺</span>
                Admin Mapas Mentais
              </NavLink>
            </>
          ) : null}
        </nav>
        <div className="mt-auto space-y-2 border-t border-slate-800/80 pt-4">
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-500 transition hover:bg-slate-800/60 hover:text-slate-200"
          >
            Sair
          </button>
        </div>
      </aside>
      <main className="min-h-screen flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <Outlet />
        </div>
      </main>
      {subscriptionModal.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-ink-950 p-5">
            <h3 className="text-lg font-semibold text-white">Assinatura necessária</h3>
            <p className="mt-2 text-sm text-slate-300">{subscriptionModal.message}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSubscriptionModal({ open: false, message: "" })}
                className="rounded border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubscriptionModal({ open: false, message: "" });
                  navigate("/app/minha-assinatura");
                }}
                className="rounded bg-sea-500 px-3 py-2 text-xs font-semibold text-ink-950 hover:bg-sea-400"
              >
                Ver planos
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
