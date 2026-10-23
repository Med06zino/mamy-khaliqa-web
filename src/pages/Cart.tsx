import { ImageOff, Minus, Plus, Trash2 } from "lucide-react";
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
  if (items.length === 0)
    return <div className="container-page"><EmptyState title="Votre panier est vide" text="Découvrez nos produits et ajoutez-les à votre panier." action={<ButtonLink to="/boutique">Voir la boutique</ButtonLink>} /></div>;
  return (
    <div className="container-page py-10">
      <h1 className="mb-8 text-4xl">Votre panier</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-4">
          {items.map((i) => (
            <li key={i.key} className="card flex gap-4 p-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-blush">
                {i.image ? <img src={i.image} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-champagne"><ImageOff className="h-6 w-6" aria-hidden /></div>}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/boutique/${i.slug}`} className="font-display text-lg hover:text-plum">{i.name}</Link>
                    {i.variantName && <p className="text-xs text-muted">{i.variantName}</p>}
                    <p className="text-sm text-muted">{formatPrice(i.unitPrice)}</p>
                  </div>
                  <button onClick={() => remove(i.key)} aria-label={`Retirer ${i.name} du panier`} className="h-fit rounded-full p-2 text-muted hover:bg-blush hover:text-danger"><Trash2 className="h-4 w-4" aria-hidden /></button>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-line" role="group" aria-label={`Quantité de ${i.name}`}>
                    <button onClick={() => setQty(i.key, i.quantity - 1)} aria-label="Diminuer" className="p-2.5"><Minus className="h-4 w-4" aria-hidden /></button>
                    <span className="w-8 text-center text-sm">{i.quantity}</span>
                    <button onClick={() => setQty(i.key, i.quantity + 1)} disabled={i.quantity >= i.maxStock} aria-label="Augmenter" className="p-2.5 disabled:opacity-40"><Plus className="h-4 w-4" aria-hidden /></button>
                  </div>
                  <p className="font-semibold text-plum">{formatPrice(i.unitPrice * i.quantity)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <aside className="card h-fit space-y-4 p-6">
          <h2 className="text-2xl">Récapitulatif</h2>
          <div className="flex justify-between text-sm"><span className="text-muted">Sous-total</span><span>{formatPrice(subtotal)}</span></div>
          <p className="text-xs text-muted">Les frais de livraison sont calculés à l'étape suivante selon votre zone. Prix et stock sont vérifiés à la validation.</p>
          <ButtonLink to="/commande" className="w-full">Passer la commande</ButtonLink>
          <WhatsAppButton className="btn btn-secondary w-full" lines={items.map((i) => ({ name: i.name, variant: i.variantName, quantity: i.quantity, unitPrice: i.unitPrice, url: `${SITE}/boutique/${i.slug}` }))} />
          <p className="text-xs text-muted">WhatsApp ouvre une conversation avec un message prérempli. Aucune commande n'est enregistrée sur le site dans ce cas.</p>
        </aside>
      </div>
    </div>
  );
}
