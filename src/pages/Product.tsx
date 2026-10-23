import { ChevronRight, Heart, ImageOff, Minus, Plus, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { ProductCard } from "../components/ProductCard";
import { Button } from "../components/ui/Button";
import { ErrorState, Spinner } from "../components/ui/States";
import { StockBadge } from "../components/ui/StockBadge";
import { WhatsAppButton } from "../components/WhatsAppButton";
import { useApi, useDocumentTitle } from "../hooks/useApi";
import { errorMessage } from "../lib/api";
import { formatPrice } from "../lib/format";
import { useAuth } from "../store/auth";
import { useCart } from "../store/cart";
import { useFavorites } from "../store/favorites";
import { toast } from "../store/toast";
import type { ProductDetail } from "../types";

const SITE = (import.meta.env.VITE_SITE_URL as string | undefined) ?? window.location.origin;

export default function Product() {
  const { slug } = useParams();
  const { data: p, loading, error, reload } = useApi<ProductDetail>(`/products/${slug}/`);
  const [variantId, setVariantId] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const add = useCart((s) => s.add);
  const user = useAuth((s) => s.user);
  const { ids, toggle } = useFavorites();
  const navigate = useNavigate();
  useDocumentTitle(p?.name ?? "Produit", p?.short_description);

  useEffect(() => { setVariantId(null); setQty(1); setImgIdx(0); }, [slug]);
  useEffect(() => {
    if (!p) return;
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", p.name);
    if (p.main_image) document.querySelector('meta[property="og:image"]')?.setAttribute("content", p.main_image);
  }, [p]);

  if (loading) return <Spinner />;
  if (error || !p) return <ErrorState message={error ?? "Produit introuvable."} onRetry={reload} />;

  const variant = p.variants.find((v) => v.id === variantId) ?? null;
  const needVariant = p.variants.length > 0 && !variant;
  const unit = variant ? variant.price : p.price;
  const stock = variant ? variant.stock : p.has_variants ? 0 : p.available_stock;
  const out = !needVariant && stock <= 0;
  const productUrl = `${SITE}/boutique/${p.slug}`;

  const onAdd = () => {
    if (needVariant) { toast.info("Choisissez une option avant d'ajouter au panier."); return; }
    const r = add({ productId: p.id, variantId: variant?.id ?? null, slug: p.slug, name: p.name, variantName: variant?.name ?? "", image: p.main_image, unitPrice: unit, maxStock: stock }, qty);
    if (r === "limit") toast.info("Quantité maximale disponible atteinte.");
    else toast.success("Ajouté au panier.");
  };
  const onFav = async () => {
    if (!user) { navigate("/connexion", { state: { from: `/boutique/${p.slug}` } }); return; }
    try { toast.success((await toggle(p.id)) ? "Ajouté à vos favoris." : "Retiré de vos favoris."); } catch (e) { toast.error(errorMessage(e)); }
  };

  const details: [string, string][] = ([["Description", p.description], ["Composition", p.ingredients], ["Conseils d'utilisation", p.usage_tips], ["Précautions", p.precautions]] as [string, string][]).filter(([, t]) => t.trim());

  return (
    <div className="container-page py-8">
      <nav aria-label="Fil d'Ariane" className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted">
        <Link to="/boutique" className="hover:text-plum">Boutique</Link><ChevronRight className="h-4 w-4" aria-hidden />
        <Link to={`/boutique/categorie/${p.category.slug}`} className="hover:text-plum">{p.category.name}</Link><ChevronRight className="h-4 w-4" aria-hidden />
        <span className="text-ink">{p.name}</span>
      </nav>
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl bg-blush">
            {p.images[imgIdx] ? <img src={p.images[imgIdx].image} alt={p.images[imgIdx].alt || p.name} className="h-full w-full object-cover" />
              : <div className="flex h-full items-center justify-center text-champagne"><ImageOff className="h-10 w-10" aria-label="Photo à venir" /></div>}
          </div>
          {p.images.length > 1 && (
            <ul className="mt-3 flex gap-2 overflow-x-auto">
              {p.images.map((im, i) => (
                <li key={im.id}><button onClick={() => setImgIdx(i)} aria-label={`Photo ${i + 1}`} aria-current={i === imgIdx} className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${i === imgIdx ? "border-plum" : "border-line"}`}><img src={im.image} alt="" loading="lazy" className="h-full w-full object-cover" /></button></li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h1 className="text-4xl">{p.name}</h1>
          <p className="mt-1 text-xs text-muted">Réf. {p.sku}{p.volume ? ` · ${p.volume}` : ""}</p>
          {p.rating.count > 0 && <p className="mt-2 text-sm text-muted">Note moyenne : {p.rating.average} / 5 ({p.rating.count} avis)</p>}
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-plum">{formatPrice(unit)}</span>
            {p.compare_at_price && !variant && <s className="text-sm text-muted">{formatPrice(p.compare_at_price)}</s>}
          </div>
          {p.short_description && <p className="mt-4 leading-7 text-muted">{p.short_description}</p>}

          {p.variants.length > 0 && (
            <fieldset className="mt-6">
              <legend className="mb-2 text-sm font-medium">Option</legend>
              <div className="flex flex-wrap gap-2">
                {p.variants.map((v) => (
                  <button key={v.id} onClick={() => { setVariantId(v.id); setQty(1); }} disabled={v.stock <= 0} aria-pressed={v.id === variantId}
                    className={`rounded-full border px-4 py-2 text-sm min-h-[44px] disabled:opacity-40 ${v.id === variantId ? "border-plum bg-plum text-ivory" : "border-line hover:border-plum"}`}>
                    {v.name}{v.stock <= 0 ? " (épuisé)" : ""}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          <div className="mt-4 flex items-center gap-3">
            <StockBadge status={out ? "out_of_stock" : p.stock_status} />
            {!out && !needVariant && <span className="text-xs text-muted">{stock} disponible{stock > 1 ? "s" : ""}</span>}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border border-line" role="group" aria-label="Quantité">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Diminuer la quantité" className="p-3"><Minus className="h-4 w-4" aria-hidden /></button>
              <span className="w-8 text-center text-sm" aria-live="polite">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(stock, q + 1))}
                disabled={out || stock <= 0}
                aria-label="Augmenter la quantité"
                className="p-3 disabled:opacity-40"
              ><Plus className="h-4 w-4" aria-hidden /></button>
            </div>
            <Button onClick={onAdd} disabled={out} className="flex-1 sm:flex-none"><ShoppingBag className="h-4 w-4" aria-hidden />Ajouter au panier</Button>
            <button onClick={onFav} aria-pressed={ids.has(p.id)} aria-label="Ajouter aux favoris" className="rounded-full border border-line p-3 text-plum hover:bg-blush"><Heart className="h-5 w-5" fill={ids.has(p.id) ? "currentColor" : "none"} aria-hidden /></button>
          </div>
          <div className="mt-3">
            <WhatsAppButton disabled={out || needVariant} lines={[{ name: p.name, variant: variant?.name, quantity: qty, unitPrice: unit, url: productUrl }]} />
            <p className="mt-2 text-xs text-muted">WhatsApp ouvre une conversation avec la boutique. La commande est confirmée par la boutique, pas automatiquement.</p>
          </div>

          <div className="mt-8 divide-y divide-line border-y border-line">
            {details.map(([title, text]) => (
              <details key={title} className="group py-4" open={title === "Description"}>
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium">{title}<ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" aria-hidden /></summary>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted">{text}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
      {p.related.length > 0 && (
        <section className="mt-16" aria-labelledby="similaires">
          <h2 id="similaires" className="mb-6 text-3xl">Produits similaires</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{p.related.map((r) => <ProductCard key={r.id} product={r} />)}</div>
        </section>
      )}
    </div>
  );
}
