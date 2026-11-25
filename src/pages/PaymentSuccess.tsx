import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import { ButtonLink } from "../components/ui/Button";
import { ApiError, errorMessage, get, post } from "../lib/api";
import { formatPrice } from "../lib/format";
import { useAuth } from "../store/auth";
import { toast } from "../store/toast";
import type { Order } from "../types";

const IS_DEV = import.meta.env.DEV;

export default function PaymentSuccess() {
  const { number: paramNumber } = useParams<{ number?: string }>();
  const [searchParams] = useSearchParams();
  const user = useAuth((s) => s.user);

  // Récupération de la référence de commande (soit du paramètre d'URL, soit de la query string)
  const number = paramNumber || searchParams.get("order") || searchParams.get("client_reference") || "";
  const isSimulated = searchParams.get("simulated") === "true";
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("Wave");
  const simulationTriggered = useRef(false);

  useEffect(() => {
    if (!number) {
      setStatus("failed");
      return;
    }

    const ctrl = new AbortController();
    let pollTimeout: number | undefined;
    let attempts = 0;
    let wasError = false;
    let notified = false;
    const startedAt = Date.now();
    const MAX_ATTEMPTS = 30;
    const MAX_WAIT_MS = 60_000;

    const scheduleRetry = () => {
      attempts += 1;
      if (attempts >= MAX_ATTEMPTS || Date.now() - startedAt >= MAX_WAIT_MS) {
        setStatus("failed");
        return;
      }
      pollTimeout = window.setTimeout(verify, wasError ? 3000 : 2000);
    };

    const verify = async () => {
      if (ctrl.signal.aborted) return;
      wasError = false;

      try {
        if (IS_DEV && isSimulated && sessionId && !simulationTriggered.current) {
          simulationTriggered.current = true;
          await post("/payments/wave/simulate/", { session_id: sessionId, success: true });
        }

        if (ctrl.signal.aborted) return;

        const data = await get<{
          status?: string;
          payment_status?: string;
          payment_method?: string;
        }>(`/payments/${number}/status/`, ctrl.signal);

        if (ctrl.signal.aborted) return;

        const provider = data.payment_method === "wave"
          ? "Wave Sénégal"
          : data.payment_method === "saspay" ? "SasPay" : "En ligne";
        setPaymentMethod(provider);

        if (data.status === "paid" || data.payment_status === "paid") {
          setStatus("success");
          const orderData = await get<Order>(`/orders/${number}/`, ctrl.signal);
          if (!ctrl.signal.aborted) setOrder(orderData);
          return;
        }

        if (data.status === "failed" || data.status === "cancelled") {
          setStatus("failed");
          return;
        }
      } catch (e) {
        if (ctrl.signal.aborted) return;
        if (e instanceof ApiError && e.status === 0) {
          setStatus("failed");
          return;
        }
        wasError = true;
        if (!notified) {
          toast.error(errorMessage(e));
          notified = true;
        }
      }

      if (!ctrl.signal.aborted) scheduleRetry();
    };

    verify();

    return () => {
      ctrl.abort();
      if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [number, isSimulated, sessionId]);

  return (
    <div className="container-page max-w-2xl py-16">
      {status === "loading" && (
        <div className="text-center">
          <Loader2 className="mx-auto h-16 w-16 animate-spin text-plum" aria-hidden />
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">
            Vérification du paiement en direct...
          </h1>
          <p className="mt-3 text-muted">
            Nous attendons la confirmation sécurisée du paiement par {paymentMethod}.
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
            Votre paiement a été validé avec succès. L'administrateur a été notifié et prépare votre commande.
          </p>

          {order && (
            <div className="mt-8 card overflow-hidden text-left shadow-sm">
              <div className="border-b border-line bg-surface px-6 py-4">
                <p className="font-display font-bold text-ink">Récapitulatif de la commande</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Client</span>
                  <span className="font-semibold text-ink">{order.first_name} {order.last_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Numéro de téléphone</span>
                  <span className="font-semibold text-ink">{order.phone}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Montant payé</span>
                  <span className="font-bold text-plum">{formatPrice(order.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Passerelle de paiement</span>
                  <span className="font-semibold text-ink">{paymentMethod}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Statut du paiement</span>
                  <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                    Confirmé &amp; Payé
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {user ? (
              <ButtonLink to={`/compte/commandes/${number}`}>
                Suivre ma commande
              </ButtonLink>
            ) : (
              <ButtonLink to={`/commande/confirmation/${number}`}>
                Voir le reçu de commande
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
            <AlertCircle className="h-10 w-10 text-danger" aria-hidden />
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Paiement non finalisé</h1>
          <p className="mt-3 text-muted">
            Le paiement a été interrompu ou n'a pas encore été validé.
          </p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
            Votre commande n° {number || "inconnue"} a été enregistrée en attente de règlement.
            Vous pouvez relancer le paiement ou contacter notre service client.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {number && (
              <ButtonLink to={`/commande/confirmation/${number}`}>
                Voir ma commande
              </ButtonLink>
            )}
            <ButtonLink to="/boutique" variant="secondary">
              Retourner à la boutique
            </ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}
