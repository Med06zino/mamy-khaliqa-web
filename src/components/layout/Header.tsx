import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  Tag,
  UserRound,
  X,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { useApi } from "../../hooks/useApi";
import { useAuth } from "../../store/auth";
import { cartCount, useCart } from "../../store/cart";
import { useSettings } from "../../store/settings";
import type { Category } from "../../types";

export function Header() {
  const { settings } = useSettings();
  const user  = useAuth((s) => s.user);
  const count = useCart((s) => cartCount(s.items));
  const { data: cats } = useApi<Category[]>("/categories/");

  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopOpen,   setShopOpen]   = useState(false);
  const [mobileShop, setMobileShop] = useState(false);
  const [q, setQ] = useState("");
  const navigate  = useNavigate();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate(`/boutique?search=${encodeURIComponent(q.trim())}`);
    setMobileOpen(false);
  };

  const navCls = (active: boolean) =>
    `relative px-1 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
      active ? "text-plum" : "text-ink/70 hover:text-plum"
    }`;

  return (
    <header className="sticky top-0 z-40 bg-ivory/95 backdrop-blur-md">

      {/* ── Bandeau annonce ───────────────────────────────── */}
      {settings.announcement_active && settings.announcement_text && (
        <div className="bg-plum px-4 py-1.5 text-center text-xs font-medium tracking-wide text-ivory">
          {settings.announcement_text}
        </div>
      )}

      {/* ── Barre principale ──────────────────────────────── */}
      <div className="border-b border-line/50">
        <div className="container-page flex h-[70px] items-center gap-6">

          {/* Burger mobile */}
          <button
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink transition-colors hover:bg-blush lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={mobileOpen}
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>

          {/* ── Logo ─────────────────────────────────────── */}
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2.5"
            aria-label={`${settings.name}, accueil`}
          >
            {settings.logo && (
              <img src={settings.logo} alt="" className="h-9 w-auto" />
            )}
            <span className="font-display text-[1.35rem] font-bold tracking-wide text-plum">
              {settings.name}
            </span>
          </Link>

          {/* ── Navigation desktop ────────────────────────── */}
          <nav
            aria-label="Navigation principale"
            className="ml-2 hidden items-center gap-6 lg:flex"
          >
            <NavLink to="/" end className={({ isActive }) => navCls(isActive)}>
              {({ isActive }) => (
                <>
                  Accueil
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-plum" />
                  )}
                </>
              )}
            </NavLink>

            {/* Boutique avec sous-menu */}
            <div
              className="relative"
              onMouseEnter={() => setShopOpen(true)}
              onMouseLeave={() => setShopOpen(false)}
            >
              <NavLink
                to="/boutique"
                onClick={() => setShopOpen(false)}
                className={({ isActive }) =>
                  `${navCls(isActive || shopOpen)} flex items-center gap-1`
                }
              >
                {({ isActive }) => (
                  <>
                    Boutique
                    <ChevronDown
                      className={`mt-px h-3.5 w-3.5 text-muted/70 transition-transform duration-200 ${
                        shopOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden
                    />
                    {isActive && (
                      <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-plum" />
                    )}
                  </>
                )}
              </NavLink>

              <AnimatePresence>
                {shopOpen && cats && cats.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute left-0 top-[calc(100%+12px)] z-50 w-64 overflow-hidden rounded-2xl border border-line bg-white shadow-xl shadow-ink/8"
                  >
                    {/* Flèche */}
                    <div className="absolute -top-1.5 left-5 h-3 w-3 rotate-45 border-l border-t border-line bg-white" />

                    <div className="p-2 pt-3">
                      <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/70">
                        Nos gammes
                      </p>
                      <ul>
                        {cats.map((c) => (
                          <li key={c.id}>
                            <Link
                              to={`/boutique/categorie/${c.slug}`}
                              onClick={() => setShopOpen(false)}
                              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-blush"
                            >
                              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-blush-deep">
                                {c.image ? (
                                  <img src={c.image} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <Tag className="h-4 w-4 text-plum/25" aria-hidden />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-ink transition-colors group-hover:text-plum">
                                  {c.name}
                                </p>
                                {c.product_count > 0 && (
                                  <p className="text-xs text-muted">
                                    {c.product_count} produit{c.product_count > 1 ? "s" : ""}
                                  </p>
                                )}
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="border-t border-line p-2">
                      <Link
                        to="/boutique"
                        onClick={() => setShopOpen(false)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-plum py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-plum-dark"
                      >
                        Voir tous les produits
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {[
              { to: "/a-propos",   label: "À propos" },
              { to: "/contact",    label: "Contact" },
              { to: "/promotions", label: "Promotions" },
            ].map(({ to, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) => navCls(isActive)}>
                {({ isActive }) => (
                  <>
                    {label}
                    {isActive && (
                      <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-plum" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* ── Recherche ─────────────────────────────────── */}
          <form onSubmit={submit} role="search" className="ml-auto hidden xl:block">
            <label htmlFor="search-desktop" className="sr-only">Rechercher</label>
            <div className="flex h-9 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-sm transition-all duration-200 focus-within:border-plum/50 focus-within:bg-white focus-within:ring-2 focus-within:ring-plum/10 hover:border-line/80">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted/60" aria-hidden />
              <input
                id="search-desktop"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher…"
                className="w-32 bg-transparent text-[13px] text-ink placeholder:text-muted/50 focus:w-40 focus:outline-none transition-all duration-200"
              />
            </div>
          </form>

          {/* ── Icônes droite ─────────────────────────────── */}
          <div className="ml-auto flex items-center gap-0.5 xl:ml-0">
            <Link
              to="/boutique"
              className="hidden h-9 w-9 items-center justify-center rounded-xl text-ink/60 transition-colors hover:bg-blush hover:text-plum lg:flex xl:hidden"
              aria-label="Rechercher"
            >
              <Search className="h-[18px] w-[18px]" aria-hidden />
            </Link>

            <Link
              to={user ? "/compte/favoris" : "/connexion"}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-ink/60 transition-colors hover:bg-blush hover:text-plum"
              aria-label="Mes favoris"
            >
              <Heart className="h-[18px] w-[18px]" aria-hidden />
            </Link>

            <Link
              to={user ? "/compte" : "/connexion"}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-ink/60 transition-colors hover:bg-blush hover:text-plum"
              aria-label={user ? "Mon compte" : "Se connecter"}
            >
              <UserRound className="h-[18px] w-[18px]" aria-hidden />
            </Link>

            <Link
              to="/panier"
              className="relative ml-0.5 flex h-9 w-9 items-center justify-center rounded-xl text-ink/60 transition-colors hover:bg-blush hover:text-plum"
              aria-label={`Panier, ${count} article${count !== 1 ? "s" : ""}`}
            >
              <ShoppingBag className="h-[18px] w-[18px]" aria-hidden />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-plum px-1 text-[9px] font-bold leading-none text-ivory">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          DRAWER MOBILE
         ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-ink/35 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="absolute inset-y-0 left-0 flex w-[82%] max-w-[340px] flex-col bg-ivory shadow-2xl"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <span className="font-display text-lg font-bold text-plum">{settings.name}</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Fermer le menu"
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-muted hover:bg-blush"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>

              {/* Recherche */}
              <div className="px-4 py-3">
                <form onSubmit={submit} role="search">
                  <label htmlFor="search-mobile" className="sr-only">Rechercher</label>
                  <div className="flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-3.5">
                    <Search className="h-4 w-4 shrink-0 text-muted/60" aria-hidden />
                    <input
                      id="search-mobile"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Rechercher un produit…"
                      className="flex-1 bg-transparent text-sm text-ink placeholder:text-muted/60 focus:outline-none"
                    />
                  </div>
                </form>
              </div>

              {/* Liens */}
              <nav aria-label="Menu mobile" className="flex-1 overflow-y-auto px-3 py-1">
                <div className="space-y-0.5">
                  {[{ to: "/", label: "Accueil", end: true }].map(({ to, label, end }) => (
                    <NavLink
                      key={to} to={to} end={end}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                          isActive ? "bg-blush font-semibold text-plum" : "text-ink hover:bg-blush/50"
                        }`
                      }
                    >
                      {label}
                    </NavLink>
                  ))}

                  {/* Boutique accordéon */}
                  <div>
                    <button
                      onClick={() => setMobileShop((v) => !v)}
                      className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-ink hover:bg-blush/50"
                      aria-expanded={mobileShop}
                    >
                      Boutique
                      <ChevronDown
                        className={`h-4 w-4 text-muted/60 transition-transform duration-200 ${mobileShop ? "rotate-180" : ""}`}
                        aria-hidden
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {mobileShop && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="ml-4 space-y-0.5 border-l-2 border-plum/15 pl-3 pb-2 pt-1">
                            <Link
                              to="/boutique"
                              onClick={() => setMobileOpen(false)}
                              className="block rounded-lg px-3 py-2 text-sm font-semibold text-plum hover:bg-blush/50"
                            >
                              Tous les produits
                            </Link>
                            {cats?.map((c) => (
                              <Link
                                key={c.id}
                                to={`/boutique/categorie/${c.slug}`}
                                onClick={() => setMobileOpen(false)}
                                className="block rounded-lg px-3 py-2 text-sm text-ink hover:bg-blush/50"
                              >
                                {c.name}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {[
                    { to: "/a-propos",   label: "À propos" },
                    { to: "/contact",    label: "Contact" },
                    { to: "/promotions", label: "Promotions" },
                  ].map(({ to, label }) => (
                    <NavLink
                      key={to} to={to}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                          isActive ? "bg-blush font-semibold text-plum" : "text-ink hover:bg-blush/50"
                        }`
                      }
                    >
                      {label}
                    </NavLink>
                  ))}
                </div>
              </nav>

              {/* Compte */}
              <div className="border-t border-line p-4">
                <Link
                  to={user ? "/compte" : "/connexion"}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-xl bg-blush px-4 py-3 text-sm font-medium text-plum transition-colors hover:bg-blush-deep"
                >
                  <UserRound className="h-4 w-4 shrink-0" aria-hidden />
                  {user ? `${user.first_name} ${user.last_name}` : "Se connecter"}
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
