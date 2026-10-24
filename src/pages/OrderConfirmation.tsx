import { CheckCircle2, Package } from "lucide-react";
import { useLocation, useParams } from "react-router-dom";

import { ButtonLink } from "../components/ui/Button";
import { WhatsAppButton } from "../components/WhatsAppButton";
import { useDocumentTitle } from "../hooks/useApi";
import { formatPrice } from "../lib/format";
import { useAuth } from "../store/auth";
import type { Order } from "../types";

export default function OrderConfirmation() {
  useDocumentTitle("Commande enregistrée");
  const { number } = useParams();
  const order = (useLocation().state as { order?: Order } | null)?.order;
  const user  = useAuth((s) => s.user);

  return (
    <div className="container-page max-w-2xl py-16">
      {/* ── En-tête succès ────────────────────────────────────── */}
      <div className="mb-10 text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-success/10">
          <CheckCircle2 className="h-10 w-10 text-success" aria-hidden />
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Commande enregistrée !</h1>
        <p className="mt-3 text-muted">Votre référence de commande</p>
        <div className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-plum/8 px-5 py-2.5">
          <Package className="h-4 w-4 text-plum" aria-hidden />
          <span className="font-display text-2xl font-bold tracking-tight text-plum">{number}</span>
        </div>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
          Conservez cette référence. La boutique vous contactera pour confirmer la commande. Le paiement n'a pas encore été effectué.
        </p>
      </div>

      {/* ── Détail commande ───────────────────────────────────── */}
      {order && (
        <div className="card overflow-hidden">
          {/* Header carte */}
          <div className="border-b border-line bg-surface px-6 py-4">
            <p className="font-display font-bold text-ink">Détail de votre commande</p>
          </div>

          <div className="p-6 space-y-5">
            {/* Articles */}
            <ul className="divide-y divide-line">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="text-ink">
                    {i.product_name}
                    {i.variant_name ? (
                      <span className="ml-1.5 rounded-full bg-blush px-2 py-0.5 text-xs font-medium text-muted">
                        {i.variant_name}
                      </span>
                    ) : null}
                    <span className="ml-1.5 text-muted">×{i.quantity}</span>
                  </span>
                  <span className="shrink-0 font-semibold text-ink">{formatPrice(i.line_total)}</span>
                </li>
              ))}
            </ul>

            {/* Totaux */}
            <div className="space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Sous-total</span>
                <span className="font-medium">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Livraison ({order.delivery_zone_name})</span>
                <span className="font-medium">
                  {order.delivery_fee_pending ? (
                    <span className="rounded-full bg-champagne/15 px-2 py-0.5 text-xs font-semibold text-champagne">À confirmer</span>
                  ) : formatPrice(order.delivery_fee)}
                </span>
              </div>
              <div className="flex justify-between rounded-xl bg-plum/6 px-3 py-2.5">
                <span className="font-display font-bold text-ink">Total</span>
                <span className="font-display text-lg font-bold text-plum">{formatPrice(order.total)}</span>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="rounded-2xl border border-line bg-surface p-4 space-y-2">
              <WhatsAppButton
                reference={order.number}
                label="Prévenir la boutique sur WhatsApp"
                lines={order.items.map((i) => ({
                  name: i.product_name,
                  variant: i.variant_name,
                  quantity: i.quantity,
                  unitPrice: i.unit_price,
                }))}
                className="btn btn-secondary w-full"
              />
              <p className="text-center text-xs text-muted">
                Facultatif : la commande est déjà enregistrée. Ce message ajoute simplement votre référence dans une conversation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Actions ───────────────────────────────────────────── */}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {user && (
          <ButtonLink to={`/compte/commandes/${number}`}>
            <Package className="h-4 w-4" aria-hidden />
            Suivre ma commande
          </ButtonLink>
        )}
        <ButtonLink to="/boutique" variant="secondary">
          Continuer mes achats
        </ButtonLink>
      </div>
    </div>
  );
}
