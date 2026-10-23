import { CheckCircle2 } from "lucide-react";
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
  const user = useAuth((s) => s.user);
  return (
    <div className="container-page max-w-2xl py-14 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-success" aria-hidden />
      <h1 className="mt-4 text-4xl">Commande enregistrée</h1>
      <p className="mt-2 text-muted">Référence de votre commande :</p>
      <p className="mt-1 font-display text-3xl text-plum">{number}</p>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted">Conservez cette référence. La boutique vous contactera pour confirmer la commande. Le paiement n'a pas encore été effectué.</p>
      {order && (
        <div className="card mt-8 p-6 text-left">
          <ul className="divide-y divide-line text-sm">
            {order.items.map((i) => <li key={i.id} className="flex justify-between gap-3 py-2"><span>{i.product_name}{i.variant_name ? ` (${i.variant_name})` : ""} x{i.quantity}</span><span>{formatPrice(i.line_total)}</span></li>)}
          </ul>
          <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
            <div className="flex justify-between"><span className="text-muted">Sous-total</span><span>{formatPrice(order.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Livraison ({order.delivery_zone_name})</span><span>{order.delivery_fee_pending ? "À confirmer" : formatPrice(order.delivery_fee)}</span></div>
            <div className="flex justify-between text-base font-semibold"><span>Total</span><span className="text-plum">{formatPrice(order.total)}</span></div>
          </div>
          <div className="mt-5">
            <WhatsAppButton reference={order.number} label="Prévenir la boutique sur WhatsApp" lines={order.items.map((i) => ({ name: i.product_name, variant: i.variant_name, quantity: i.quantity, unitPrice: i.unit_price }))} />
            <p className="mt-2 text-xs text-muted">Facultatif : la commande est déjà enregistrée. Ce message ajoute simplement votre référence dans une conversation.</p>
          </div>
        </div>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {user && <ButtonLink to={`/compte/commandes/${number}`}>Suivre ma commande</ButtonLink>}
        <ButtonLink to="/boutique" variant="secondary">Continuer mes achats</ButtonLink>
      </div>
    </div>
  );
}
