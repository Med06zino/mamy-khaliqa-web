import { ChevronRight, Heart, ImageOff, Minus, Plus, Share2, ShoppingBag, Star } from "lucide-react";
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
  const [tab, setTab] = useState<string | null>(null);

  const add      = useCart((s) => s.add);
  const user     = useAuth((s) => s.user);
  const { ids, toggle } = useFavorites();
  const navigate = useNavigate();

  useDocumentTitle(p?.name ?? "Produit", p?.short_description);

  useEffect(() => { setVariantId(null); setQty(1); setImgIdx(0); setTab(null); }, [slug]);
  useEffect(() => {
    if (!p) return;
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", p.name);
    if (p.main_image) document.querySelector('meta[property="og:image"]')?.setAttribute("content", p.main_image);
    // ouvrir le premier onglet disponible
    const first = ([["description", p.description], ["ingredients", p.ingredients], ["usage_tips", p.usage_tips], ["precautions", p.precautions]] as [string, string][]).find(([, t]) => t.trim());
    if (first) setTab(first[0]);
  }, [p]);

  if (loading) return <Spinner />;
  if (error || !p) return <ErrorState message={error ?? "Produit introuvable."} onRetry={reload} />;

  const variant    = p.variants.find((v) => v.id === variantId) ?? null;
  const needVariant = p.variants.length > 0 && !variant;
  const unit       = variant ? variant.price : p.price;
  const stock      = variant ? variant.stock : p.has_variants ? 0 : p.available_stock;
  const out        = !needVariant && stock <= 0;
  const productUrl = `${SITE}/boutique/${p.slug}`;

  const onAdd = () => {
    if (needVariant) { toast.info("Choisissez une option avant d'ajouter au panier."); return; }
    const r = add({ productId: p.id, variantId: variant?.id ?? null, slug: p.slug, name: p.name, variantName: variant?.name ?? "", image: p.main_image, unitPrice: unit, maxStock: stock, categoryName: p.category.name }, qty);
    if (r === "limit") toast.info("Quantité maximale disponible atteinte.");
    else toast.success("Ajouté au panier.");
  };
  const onFav = async () => {
    if (!user) { navigate("/connexion", { state: { from: `/boutique/${p.slug}` } }); return; }
    try { toast.success((await toggle(p.id)) ? "Ajouté à vos favoris." : "Retiré de vos favoris."); }
    catch (e) { toast.error(errorMessage(e)); }
  };
  const onShare = async () => {
    if (navigator.share) { await navigator.share({ title: p.name, url: productUrl }).catch(() => {}); }
    else { await navigator.clipboard.writeText(productUrl); toast.success("Lien copié !"); }
  };

  const tabs = ([
    ["Description",           "description",  p.description],
    ["Composition",           "ingredients",  p.ingredients],
    ["Conseils d'utilisation","usage_tips",   p.usage_tips],
    ["Précautions",           "precautions",  p.precautions],
  ] as [string, string, string][]).filter(([, , t]) => t.trim());

  return (
    <div className="container-page py-8 lg:py-12">
      {/* Fil d'Ariane */}
      <nav aria-label="Fil d'Ariane" className="mb-8 flex flex-wrap items-center gap-1.5 text-sm text-muted">
        <Link to="/boutique" className="hover:text-plum transition-colors">Boutique</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <Link to={`/boutique/categorie/${p.category.slug}`} className="hover:text-plum transition-colors">{p.category.name}</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span className="font-medium text-ink">{p.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* ── Galerie ─────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-blush">
            {p.images[imgIdx] ? (
              <img src={p.images[imgIdx].image} alt={p.images[imgIdx].alt || p.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-champagne/50">
                <ImageOff className="h-12 w-12" aria-label="Photo à venir" />
              </div>
            )}
            {/* Badge promo */}
            {p.compare_at_price && !variant && (
              <span className="absolute left-4 top-4 rounded-full bg-plum px-3 py-1 text-xs font-bold text-ivory shadow">Promo</span>
            )}
          </div>
          {/* Miniatures */}
          {p.images.length > 1 && (
            <ul className="flex gap-2 overflow-x-auto pb-1">
              {p.images.map((im, i) => (
                <li key={im.id}>
                  <button
                    onClick={() => setImgIdx(i)} aria-label={`Photo ${i + 1}`} aria-current={i === imgIdx}
                    className={`h-16 w-16 overflow-hidden rounded-xl border-2 transition-colors ${i === imgIdx ? "border-plum" : "border-line hover:border-plum/50"}`}
                  >
                    <img src={im.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Infos produit ────────────────────────────────────── */}
        <div className="space-y-5">
          <div>
            <Link to={`/boutique/categorie/${p.category.slug}`} className="text-xs font-semibold uppercase tracking-widest text-muted hover:text-plum transition-colors">
              {p.category.name}
            </Link>
            <h1 className="mt-2 font-display text-4xl font-bold leading-tight tracking-tight">{p.name}</h1>
            <p className="mt-1 text-xs text-muted">Réf. {p.sku}{p.volume ? ` · ${p.volume}` : ""}</p>
          </div>

          {/* Note */}
          {p.rating.count > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.round(p.rating.average ?? 0) ? "fill-champagne text-champagne" : "text-line"}`} aria-hidden />
                ))}
              </div>
              <span className="text-sm font-semibold text-ink">{p.rating.average}/5</span>
              <span className="text-sm text-muted">({p.rating.count} avis)</span>
            </div>
          )}

          {/* Prix */}
          <div className="flex items-baseline gap-3">
            <span className="font-display text-4xl font-bold text-plum">{formatPrice(unit)}</span>
            {p.compare_at_price && !variant && (
              <s className="text-base text-muted">{formatPrice(p.compare_at_price)}</s>
            )}
          </div>

          {p.short_description && (
            <p className="leading-relaxed text-muted">{p.short_description}</p>
          )}

          {/* Variantes */}
          {p.variants.length > 0 && (
            <fieldset>
              <legend className="mb-3 text-sm font-semibold text-ink">Option</legend>
              <div className="flex flex-wrap gap-2">
                {p.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => { setVariantId(v.id); setQty(1); }}
                    disabled={v.stock <= 0}
                    aria-pressed={v.id === variantId}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-medium min-h-[44px] transition-all disabled:opacity-40 ${
                      v.id === variantId
                        ? "border-plum bg-plum text-ivory shadow-sm"
                        : "border-line hover:border-plum/50 hover:bg-blush"
                    }`}
                  >
                    {v.name}{v.stock <= 0 ? " (épuisé)" : ""}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {/* Stock */}
          <div className="flex items-center gap-3">
            <StockBadge status={out ? "out_of_stock" : p.stock_status} />
            {!out && !needVariant && (
              <span className="text-xs text-muted">{stock} disponible{stock > 1 ? "s" : ""}</span>
            )}
          </div>

          {/* Quantité + Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Sélecteur de quantité */}
            <div
              className="flex items-center gap-1 rounded-2xl border border-line bg-white p-1 shadow-xs"
              role="group" aria-label="Quantité"
            >
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Diminuer la quantité"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-ink transition-colors hover:bg-blush disabled:opacity-40"
                disabled={qty <= 1}
              >
                <Minus className="h-4 w-4" aria-hidden />
              </button>
              <span className="w-10 text-center text-sm font-semibold" aria-live="polite">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(stock, q + 1))}
                disabled={out || stock <= 0}
                aria-label="Augmenter la quantité"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-ink transition-colors hover:bg-blush disabled:opacity-40"
              >
                <Plus className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <Button onClick={onAdd} disabled={out} className="flex-1 sm:flex-none !rounded-2xl !px-6">
              <ShoppingBag className="h-4 w-4" aria-hidden />
              {needVariant ? "Choisir une option" : "Ajouter au panier"}
            </Button>

            {/* Favori */}
            <button
              onClick={onFav}
              aria-pressed={ids.has(p.id)}
              aria-label={ids.has(p.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
              className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all ${
                ids.has(p.id) ? "border-plum bg-plum/8 text-plum" : "border-line hover:border-plum/50 hover:bg-blush text-ink"
              }`}
            >
              <Heart className="h-5 w-5" fill={ids.has(p.id) ? "currentColor" : "none"} aria-hidden />
            </button>

            {/* Partager */}
            <button
              onClick={onShare}
              aria-label="Partager ce produit"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-line text-muted transition-all hover:border-plum/50 hover:bg-blush hover:text-plum"
            >
              <Share2 className="h-4 w-4" aria-hidden />
            </button>
          </div>

          {/* WhatsApp */}
          <div className="rounded-2xl border border-line bg-white p-4 space-y-2">
            <WhatsAppButton
              disabled={out || needVariant}
              lines={[{ name: p.name, variant: variant?.name, quantity: qty, unitPrice: unit, url: productUrl }]}
              className="btn btn-secondary w-full !rounded-xl"
            />
            <p className="text-center text-xs text-muted">
              WhatsApp ouvre une conversation avec la boutique. La commande est confirmée par la boutique, pas automatiquement.
            </p>
          </div>
        </div>
      </div>

      {/* ── Onglets description ──────────────────────────────────── */}
      {tabs.length > 0 && (
        <div className="mt-14">
          {/* Tab bar */}
          <div className="flex gap-1 overflow-x-auto border-b border-line pb-0" role="tablist">
            {tabs.map(([label, key]) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`shrink-0 rounded-t-xl border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
                  tab === key
                    ? "border-plum text-plum"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Contenu */}
          {tabs.map(([, key, text]) => (
            <div
              key={key}
              role="tabpanel"
              hidden={tab !== key}
              className="mt-6 max-w-2xl whitespace-pre-line text-sm leading-7 text-muted"
            >
              {text}
            </div>
          ))}
        </div>
      )}

      {/* ── Produits similaires ──────────────────────────────────── */}
      {p.related.length > 0 && (
        <section className="mt-16" aria-labelledby="similaires">
          <h2 id="similaires" className="mb-8 font-display text-3xl font-bold tracking-tight">
            Produits similaires
          </h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {p.related.map((r) => <ProductCard key={r.id} product={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}
