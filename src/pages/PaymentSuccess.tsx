import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { ButtonLink } from "../components/ui/Button";
import { formatPrice } from "../lib/format";
import { useAuth } from "../store/auth";
import { toast } from "../store/toast";
import type { Order } from "../types";

export default function PaymentSuccess() {
  const { number } = useParams();
  const user = useAuth((s) => s.user);
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [order, setOrder] = useState<Order | null>(null);

  // Vérifier le statut du paiement auprès du backend
  useEffect(() => {
    if (!number) return;

    const checkPaymentStatus = async () => {
      try {
        // Appeler l'endpoint pour vérifier le statut
        const response = await fetch(`/api/v1/payments/${number}/saspay/status/`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la vérification du paiement");
        }

        const data = await response.json();

        if (data.status === "paid") {
          setStatus("success");
          // Récupérer les détails de la commande
          const orderResponse = await fetch(`/api/v1/orders/${number}/`, {
            credentials: "include",
          });
          if (orderResponse.ok) {
            const orderData = await orderResponse.json();
            setOrder(orderData);
          }
        } else if (data.status === "failed" || data.status === "cancelled") {
          setStatus("failed");
        } else {
          // Encore en attente, réessayer après un délai
          setTimeout(checkPaymentStatus, 2000);
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
        toast.error("Erreur lors de la vérification du paiement");
        setStatus("failed");
      }
    };

    checkPaymentStatus();
  }, [number]);

  return (
    <div className="container-page max-w-2xl py-16">
      {status === "loading" && (
        <div className="text-center">
          <Loader2 className="mx-auto h-16 w-16 animate-spin text-plum" aria-hidden />
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">
            Vérification du paiement...
          </h1>
          <p className="mt-3 text-muted">
            Nous confirmons votre paiement auprès de SasPay.
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-success/10">
            <CheckCircle2 className="h-10 w-10 text-success" aria-hidden />
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Paiement réussi !</h1>
          <p className="mt-3 text-muted">Votre référence de commande</p>
          <div className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-plum/8 px-5 py-2.5">
            <span className="font-display text-2xl font-bold tracking-tight text-plum">{number}</span>
          </div>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
            Votre paiement a été confirmé avec succès. La boutique traitera votre commande.
          </p>

          {order && (
            <div className="mt-8 card overflow-hidden text-left">
              <div className="border-b border-line bg-surface px-6 py-4">
                <p className="font-display font-bold text-ink">Récapitulatif de la commande</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Montant payé</span>
                  <span className="font-semibold">{formatPrice(order.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Méthode de paiement</span>
                  <span className="font-semibold">SasPay</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Statut du paiement</span>
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                    Payé
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {user && (
              <ButtonLink to={`/compte/commandes/${number}`}>
                Suivre ma commande
              </ButtonLink>
            )}
            <ButtonLink to="/boutique" variant="secondary">
              Continuer mes achats
            </ButtonLink>
          </div>
        </div>
      )}

      {status === "failed" && (
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-danger/10">
            <svg className="h-10 w-10 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Paiement échoué</h1>
          <p className="mt-3 text-muted">
            Une erreur est survenue lors du paiement ou celui-ci a été annulé.
          </p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
            Votre commande n° {number} a été enregistrée mais n'est pas encore payée.
            Vous pouvez réessayer le paiement ou contacter la boutique.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink to={`/commande/confirmation/${number}`}>
              Voir ma commande
            </ButtonLink>
            <ButtonLink to="/boutique" variant="secondary">
              Continuer mes achats
            </ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}
