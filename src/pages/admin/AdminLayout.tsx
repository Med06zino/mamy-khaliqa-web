import {
  ChartNoAxesCombined, ExternalLink, LogOut, MessageSquare,
  Package, Settings, ShoppingCart, Users,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useDocumentTitle } from "../../hooks/useApi";
import { useAuth } from "../../store/auth";

const LINKS = [
  { to: "/admin",              label: "Tableau de bord", Icon: ChartNoAxesCombined, end: true  },
  { to: "/admin/produits",     label: "Produits",         Icon: Package,             end: false },
  { to: "/admin/commandes",    label: "Commandes",        Icon: ShoppingCart,        end: false },
  { to: "/admin/clients",      label: "Clients",          Icon: Users,               end: false },
  { to: "/admin/avis-messages",label: "Avis & messages",  Icon: MessageSquare,       end: false },
  { to: "/admin/parametres",   label: "Paramètres",       Icon: Settings,            end: false },
];

export function AdminLayout() {
  useDocumentTitle("Administration");
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-[#0F0D12] text-white">
      {/* ── Top bar ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/8 bg-[#0F0D12]/95 px-4 backdrop-blur-sm lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-plum">
            <span className="font-display text-xs font-bold text-ivory">MK</span>
          </div>
          <span className="font-display text-sm font-bold tracking-tight text-white">
            Administration
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="hidden text-white/40 sm:inline">{user?.email}</span>
          <NavLink
            to="/"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-white/60 transition-colors hover:bg-white/8 hover:text-white"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">Voir le site</span>
          </NavLink>
          <button
            onClick={async () => { await logout(); nav("/"); }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-white/60 transition-colors hover:bg-white/8 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      <div className="flex">
        {/* ── Sidebar ───────────────────────────────────────────── */}
        <nav
          aria-label="Administration"
          className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 flex-col overflow-y-auto border-r border-white/8 bg-[#0F0D12] px-3 py-4 lg:flex"
        >
          <ul className="space-y-0.5">
            {LINKS.map(({ to, label, Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to} end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-plum/20 text-plum-light"
                        : "text-white/60 hover:bg-white/6 hover:text-white"
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── Nav mobile (barre horizontale) ────────────────────── */}
        <nav
          aria-label="Administration mobile"
          className="fixed bottom-0 inset-x-0 z-40 flex justify-around border-t border-white/8 bg-[#0F0D12]/95 px-2 py-2 backdrop-blur-sm lg:hidden"
        >
          {LINKS.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-medium transition-colors ${
                  isActive ? "text-plum-light" : "text-white/50 hover:text-white"
                }`
              }
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span className="hidden xs:inline">{label.split(" ")[0]}</span>
            </NavLink>
          ))}
        </nav>

        {/* ── Contenu ───────────────────────────────────────────── */}
        <main className="min-w-0 flex-1 p-4 pb-20 lg:p-8 lg:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
