import { ImageOff, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { ButtonLink } from "../components/ui/Button";
import { EmptyState } from "../components/ui/States";
import { WhatsAppButton } from "../components/WhatsAppButton";
import { useDocumentTitle } from "../hooks/useApi";
import { formatPrice } from "../lib/format";
import { cartSubtotal, useCart } from "../store/cart";

const SITE = (import.meta.env.VITE_SITE_URL as string | undefined) ?? window.location.origin;

export default function Cart() {
  useDocumentTitle("Panier");
  const { items, setQty, remove } = useCart();
  const subtotal = cartSubtotal(items);

  if (items.length === 0) {
    return (
      <div className="container-page py-20">
        <EmptyState
          title="Votre panier est vide"
          text="Découvrez nos produits et ajoutez-les à votre panier."
          action={
            <ButtonLink to="/boutique">
              <ShoppingBag className="h-4 w-4" aria-hidden />
              Voir la boutique
            </ButtonLink>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="mb-8 font-display text-4xl font-bold tracking-tight">Votre panier</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* ── Articles ──────────────────────────────────────── */}
        <ul className="space-y-4">
          {items.map((i) => (
            <li key={i.key} className="card flex gap-4 p-4 sm:p-5">
              {/* Image cliquable */}
              <Link
                to={`/boutique/${i.slug}`}
                className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-blush sm:h-28 sm:w-28"
              >
                {i.image ? (
                  <img
                    src={i.image}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-champagne/50">
                    <ImageOff className="h-6 w-6" aria-hidden />
                  </div>
                )}
              </Link>

              {/* Infos */}
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {/* Univers (catégorie / gamme) */}
                    {i.categoryName && (
                      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted">
                        {i.categoryName}
                      </p>
                    )}
                    <Link
                      to={`/boutique/${i.slug}`}
                      className="font-display text-base font-semibold text-ink transition-colors hover:text-plum"
                    >
                      {i.name}
                    </Link>
                    {i.variantName && (
                      <p className="mt-0.5 text-xs font-medium text-muted">{i.variantName}</p>
                    )}
                    <p className="mt-1 text-sm text-muted">{formatPrice(i.unitPrice)} / unité</p>
                  </div>
                  <button
                    onClick={() => remove(i.key)}
                    aria-label={`Retirer ${i.name} du panier`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-muted transition-all hover:bg-danger/8 hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>

                {/* Quantité + total ligne */}
                <div className="mt-auto flex items-center justify-between gap-3">
                  <div
                    className="flex items-center gap-1 rounded-xl border border-line bg-white p-0.5"
                    role="group"
                    aria-label={`Quantité de ${i.name}`}
                  >
                    <button
                      onClick={() => setQty(i.key, i.quantity - 1)}
                      aria-label="Diminuer"
                      disabled={i.quantity <= 1}
                      className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-blush disabled:opacity-40"
                    >
                      <Minus className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{i.quantity}</span>
                    <button
                      onClick={() => setQty(i.key, i.quantity + 1)}
                      disabled={i.quantity >= i.maxStock}
                      aria-label="Augmenter"
                      className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-blush disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                  <p className="font-display text-lg font-bold text-plum">
                    {formatPrice(i.unitPrice * i.quantity)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* ── Récapitulatif ──────────────────────────────────── */}
        <aside className="h-fit space-y-5 rounded-3xl border border-line bg-white p-6 shadow-card">
          <h2 className="font-display text-xl font-bold">Récapitulatif</h2>

          {/* Lignes avec univers */}
          <div className="space-y-3 border-b border-line pb-4">
            {items.map((i) => (
              <div key={i.key} className="flex items-start justify-between gap-2 text-sm">
                <span className="min-w-0 text-muted">
                  <span className="font-medium text-ink">{i.name}</span>
                  {i.variantName ? ` (${i.variantName})` : ""}
                  {i.categoryName ? (
                    <span className="ml-1 text-[10px] text-muted/60">· {i.categoryName}</span>
                  ) : null}
                  {" "}× {i.quantity}
                </span>
                <span className="shrink-0 font-semibold">{formatPrice(i.unitPrice * i.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Sous-total */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Sous-total</span>
            <span className="font-display text-xl font-bold text-plum">{formatPrice(subtotal)}</span>
          </div>

          <p className="rounded-xl bg-blush px-3 py-2.5 text-xs leading-relaxed text-muted">
            Les frais de livraison sont calculés à l'étape suivante selon votre zone.
            Prix et stock sont vérifiés à la validation.
          </p>

          <ButtonLink to="/commande" className="w-full">
            Passer la commande
          </ButtonLink>

          {/* ── Bouton WhatsApp ── */}
          <div className="space-y-2">
            <WhatsAppButton
              className="btn btn-secondary w-full"
              label="Commander par WhatsApp"
              lines={items.map((i) => ({
                name: i.name,
                variant: i.variantName || undefined,
                universe: i.categoryName || undefined,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                url: `${SITE}/boutique/${i.slug}`,
              }))}
            />
            <p className="text-center text-xs text-muted">
              Un message prérempli s'ouvre dans WhatsApp — vous pouvez le vérifier
              et le modifier avant de l'envoyer. La commande n'est enregistrée
              que si vous confirmez via le site.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
