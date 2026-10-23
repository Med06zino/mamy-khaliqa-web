import { ChartNoAxesCombined, LogOut, MessageSquare, Package, Settings, ShoppingCart, Users } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useDocumentTitle } from "../../hooks/useApi";
import { useAuth } from "../../store/auth";

export function AdminLayout() {
  useDocumentTitle("Administration");
  const { logout } = useAuth();
  const nav = useNavigate();
  const links = [
    { to: "/admin", label: "Tableau de bord", Icon: ChartNoAxesCombined, end: true }, { to: "/admin/produits", label: "Produits", Icon: Package, end: false },
    { to: "/admin/commandes", label: "Commandes", Icon: ShoppingCart, end: false }, { to: "/admin/clients", label: "Clients", Icon: Users, end: false },
    { to: "/admin/avis-messages", label: "Avis et messages", Icon: MessageSquare, end: false }, { to: "/admin/parametres", label: "Paramètres", Icon: Settings, end: false },
  ];
  return (
    <div className="min-h-screen bg-ivory">
      <div className="border-b border-line bg-plum px-4 py-3 text-ivory">
        <div className="container-page flex items-center justify-between !px-0">
          <span className="font-display text-xl">Mamy Khaliqa : administration</span>
          <div className="flex items-center gap-3 text-sm">
            <NavLink to="/" className="hover:underline">Voir le site</NavLink>
            <button onClick={async () => { await logout(); nav("/"); }} className="flex items-center gap-1 hover:underline"><LogOut className="h-4 w-4" aria-hidden />Déconnexion</button>
          </div>
        </div>
      </div>
      <div className="container-page grid gap-6 py-8 md:grid-cols-[220px_1fr]">
        <nav aria-label="Administration" className="flex gap-2 overflow-x-auto md:flex-col">
          {links.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm ${isActive ? "bg-plum text-ivory" : "hover:bg-blush"}`}><Icon className="h-4 w-4" aria-hidden />{label}</NavLink>
          ))}
        </nav>
        <div className="min-w-0"><Outlet /></div>
      </div>
    </div>
  );
}
