import { AnimatePresence, motion } from "framer-motion";
import { Heart, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { useApi } from "../../hooks/useApi";
import { useAuth } from "../../store/auth";
import { cartCount, useCart } from "../../store/cart";
import { useSettings } from "../../store/settings";
import type { Category } from "../../types";

export function Header() {
  const { settings } = useSettings();
  const user = useAuth((s) => s.user);
  const count = useCart((s) => cartCount(s.items));
  const { data: cats } = useApi<Category[]>("/categories/");
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(q.trim() ? `/boutique?search=${encodeURIComponent(q.trim())}` : "/boutique");
    setOpen(false);
  };
  const nav = [{ to: "/", label: "Accueil", end: true }, { to: "/boutique", label: "Boutique", end: true },
    ...(cats ?? []).map((c) => ({ to: `/boutique/categorie/${c.slug}`, label: c.name, end: false })),
    { to: "/a-propos", label: "À propos", end: false }, { to: "/contact", label: "Contact", end: false }];
  const link = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap text-sm transition-colors hover:text-plum ${isActive ? "font-medium text-plum" : "text-ink"}`;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ivory/95 backdrop-blur">
      {settings.announcement_active && settings.announcement_text && (
        <div className="bg-plum px-4 py-2 text-center text-xs text-ivory">{settings.announcement_text}</div>
      )}
      <div className="container-page flex h-16 items-center gap-4">
        <button className="rounded-full p-2 hover:bg-blush lg:hidden" onClick={() => setOpen(true)} aria-label="Ouvrir le menu" aria-expanded={open}>
          <Menu className="h-6 w-6" aria-hidden />
        </button>
        <Link to="/" className="flex items-center gap-2" aria-label={`${settings.name}, accueil`}>
          {settings.logo ? <img src={settings.logo} alt="" className="h-9 w-auto" /> : null}
          <span className="whitespace-nowrap font-display text-2xl font-semibold text-plum">{settings.name}</span>
        </Link>
        <nav aria-label="Navigation principale" className="ml-4 hidden items-center gap-5 lg:flex">
          {nav.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={link}>{n.label}</NavLink>)}
        </nav>
        <form onSubmit={submit} role="search" className="ml-auto hidden xl:block">
          <label htmlFor="search-desktop" className="sr-only">Rechercher un produit</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <input id="search-desktop" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher" className="input w-48 !pl-9" />
          </div>
        </form>
        <div className="ml-auto flex items-center gap-1 xl:ml-2">
          <Link to="/boutique" className="hidden rounded-full p-2.5 hover:bg-blush lg:inline-flex xl:hidden" aria-label="Rechercher un produit"><Search className="h-5 w-5" aria-hidden /></Link>
          <Link to={user ? "/compte/favoris" : "/connexion"} className="rounded-full p-2.5 hover:bg-blush" aria-label="Mes favoris"><Heart className="h-5 w-5" aria-hidden /></Link>
          <Link to={user ? "/compte" : "/connexion"} className="rounded-full p-2.5 hover:bg-blush" aria-label={user ? "Mon compte" : "Se connecter"}><UserRound className="h-5 w-5" aria-hidden /></Link>
          <Link to="/panier" className="relative rounded-full p-2.5 hover:bg-blush" aria-label={`Panier, ${count} article${count > 1 ? "s" : ""}`}>
            <ShoppingBag className="h-5 w-5" aria-hidden />
            {count > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-plum px-1 text-[11px] text-ivory">{count}</span>}
          </Link>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
            <motion.div role="dialog" aria-modal="true" aria-label="Menu" className="absolute inset-y-0 left-0 w-[85%] max-w-sm overflow-y-auto bg-ivory p-5"
              initial={{ x: -40 }} animate={{ x: 0 }} exit={{ x: -40 }}>
              <div className="mb-6 flex items-center justify-between">
                <span className="font-display text-xl text-plum">{settings.name}</span>
                <button onClick={() => setOpen(false)} aria-label="Fermer le menu" className="rounded-full p-2 hover:bg-blush"><X className="h-5 w-5" aria-hidden /></button>
              </div>
              <form onSubmit={submit} role="search" className="mb-6">
                <label htmlFor="search-mobile" className="sr-only">Rechercher un produit</label>
                <input id="search-mobile" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un produit" className="input" />
              </form>
              <nav aria-label="Menu mobile" className="flex flex-col">
                {nav.map((n) => <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)} className={(s) => `border-b border-line py-3.5 ${link(s)}`}>{n.label}</NavLink>)}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
