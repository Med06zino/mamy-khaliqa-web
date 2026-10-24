import { motion } from "framer-motion";
import { ArrowRight, Heart, ImageOff, ShoppingBag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { errorMessage } from "../lib/api";
import { formatPrice } from "../lib/format";
import { useAuth } from "../store/auth";
import { useCart } from "../store/cart";
import { useFavorites } from "../store/favorites";
import { toast } from "../store/toast";
import type { ProductListItem } from "../types";
import { StockBadge } from "./ui/StockBadge";

interface Props { product: ProductListItem }

/**
 * Carte produit — image, nom, prix FCFA, stock, bouton "Ajouter au panier" et "Voir les détails".
 * Le nom de la catégorie est transmis au panier pour identifier l'univers (Beauty / Hair).
 */
export function ProductCard({ product: p }: Props) {
  const add      = useCart((s) => s.add);
  const user     = useAuth((s) => s.user);
  const { ids, toggle } = useFavorites();
  const navigate = useNavigate();

  const fav = ids.has(p.id);
  const out = p.stock_status === "out_of_stock";

  const onAdd = () => {
    if (p.has_variants) { navigate(`/boutique/${p.slug}`); return; }
    const r = add({
      productId: p.id,
      variantId: null,
      slug: p.slug,
      name: p.name,
      variantName: "",
      image: p.main_image,
      unitPrice: p.price,
      maxStock: p.available_stock,
      categoryName: p.category.name,   // univers transmis au panier
    });
    if (r === "limit") toast.info("Quantité maximale disponible atteinte.");
    else toast.success(`${p.name} ajouté au panier.`);
  };

  const onFav = async () => {
    if (!user) { navigate("/connexion", { state: { from: `/boutique/${p.slug}` } }); return; }
    try {
      const on = await toggle(p.id);
      toast.success(on ? "Ajouté à vos favoris." : "Retiré de vos favoris.");
    } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <motion.article
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover"
      aria-label={p.name}
    >
      {/* ── Image ─────────────────────────────────────────── */}
      <div className="relative aspect-square overflow-hidden bg-surface">
        <Link to={`/boutique/${p.slug}`} aria-label={`Voir ${p.name}`} className="block h-full w-full">
          {p.main_image ? (
            <img
              src={p.main_image}
              alt={p.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-plum/15">
              <ImageOff className="h-10 w-10" aria-label="Photo à venir" />
            </div>
          )}
        </Link>

        {/* Badge promo */}
        {p.compare_at_price && (
          <span className="absolute left-3 top-3 rounded-full bg-plum px-2.5 py-1 text-[11px] font-bold text-ivory shadow-sm">
            Promo
          </span>
        )}

        {/* Favori */}
        <button
          onClick={onFav}
          aria-pressed={fav}
          aria-label={fav ? `Retirer ${p.name} des favoris` : `Ajouter ${p.name} aux favoris`}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:scale-110 active:scale-95"
        >
          <Heart className="h-4 w-4 text-plum" fill={fav ? "currentColor" : "none"} aria-hidden />
        </button>
      </div>

      {/* ── Infos ─────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Univers (catégorie) */}
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          {p.category.name}
        </p>

        <h3 className="font-display text-base font-semibold leading-snug text-ink">
          <Link to={`/boutique/${p.slug}`} className="transition-colors hover:text-plum">
            {p.name}
          </Link>
        </h3>

        {p.short_description && (
          <p className="line-clamp-1 text-xs text-muted">{p.short_description}</p>
        )}

        {/* Prix */}
        <div className="flex items-baseline gap-2">
          <span className="font-display text-lg font-bold text-plum">{formatPrice(p.price)}</span>
          {p.compare_at_price && (
            <s className="text-xs text-muted">{formatPrice(p.compare_at_price)}</s>
          )}
        </div>

        <StockBadge status={p.stock_status} />

        {/* Actions */}
        <div className="mt-auto flex gap-2 pt-2">
          {/* Voir les détails */}
          <Link
            to={`/boutique/${p.slug}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-plum py-2.5 text-sm font-semibold text-plum transition-all hover:bg-blush hover:-translate-y-0.5"
            aria-label={`Voir les détails de ${p.name}`}
          >
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            Détails
          </Link>

          {/* Ajouter au panier */}
          <button
            onClick={onAdd}
            disabled={out}
            aria-label={`Ajouter ${p.name} au panier`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-plum py-2.5 text-sm font-semibold text-ivory shadow-sm transition-all hover:bg-plum-dark hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
            {p.has_variants ? "Choisir" : "Ajouter"}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card">
      <div className="skeleton aspect-square w-full" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-3 w-1/3 rounded-full" />
        <div className="skeleton h-5 w-4/5 rounded-lg" />
        <div className="skeleton h-3 w-full rounded-lg" />
        <div className="skeleton h-5 w-1/2 rounded-lg" />
        <div className="skeleton h-9 w-full rounded-full" />
      </div>
    </div>
  );
}
