import { Heart, ImageOff, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

import { errorMessage } from "../lib/api";
import { formatPrice } from "../lib/format";
import { useAuth } from "../store/auth";
import { useCart } from "../store/cart";
import { useFavorites } from "../store/favorites";
import { toast } from "../store/toast";
import type { ProductListItem } from "../types";
import { StockBadge } from "./ui/StockBadge";

export function ProductCard({ product: p }: { product: ProductListItem }) {
  const add = useCart((s) => s.add);
  const user = useAuth((s) => s.user);
  const { ids, toggle } = useFavorites();
  const navigate = useNavigate();
  const fav = ids.has(p.id);
  const out = p.stock_status === "out_of_stock";

  const onAdd = () => {
    if (p.has_variants) { navigate(`/boutique/${p.slug}`); return; }
    const r = add({ productId: p.id, variantId: null, slug: p.slug, name: p.name, variantName: "", image: p.main_image, unitPrice: p.price, maxStock: p.available_stock });
    if (r === "limit") toast.info("Quantité maximale disponible atteinte pour ce produit.");
    else toast.success(`${p.name} ajouté au panier.`);
  };
  const onFav = async () => {
    if (!user) { navigate("/connexion", { state: { from: `/boutique/${p.slug}` } }); return; }
    try { const on = await toggle(p.id); toast.success(on ? "Ajouté à vos favoris." : "Retiré de vos favoris."); }
    catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <motion.article className="card group flex flex-col overflow-hidden" whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
      <div className="relative aspect-square bg-blush">
        <Link to={`/boutique/${p.slug}`} aria-label={`Voir ${p.name}`} className="block h-full w-full">
          {p.main_image ? (
            <img src={p.main_image} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-champagne"><ImageOff className="h-8 w-8" aria-label="Photo à venir" /></div>
          )}
        </Link>
        <button onClick={onFav} aria-pressed={fav} aria-label={fav ? `Retirer ${p.name} des favoris` : `Ajouter ${p.name} aux favoris`}
          className="absolute right-3 top-3 rounded-full bg-ivory/90 p-2 text-plum hover:bg-ivory">
          <Heart className="h-5 w-5" fill={fav ? "currentColor" : "none"} aria-hidden />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link to={`/boutique/categorie/${p.category.slug}`} className="text-xs text-muted hover:text-plum">{p.category.name}</Link>
        <h3 className="text-lg leading-snug"><Link to={`/boutique/${p.slug}`}>{p.name}</Link></h3>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-semibold text-plum">{formatPrice(p.price)}</span>
          {p.compare_at_price && <s className="text-xs text-muted">{formatPrice(p.compare_at_price)}</s>}
        </div>
        <StockBadge status={p.stock_status} />
        <div className="mt-auto flex gap-2 pt-2">
          <Link to={`/boutique/${p.slug}`} className="btn btn-secondary flex-1 !px-3">Voir</Link>
          <button onClick={onAdd} disabled={out} aria-label={`Ajouter ${p.name} au panier`} className="btn btn-primary !px-3">
            <ShoppingBag className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
