import { CreditCard, MapPin, ShoppingBag, User } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button, ButtonLink } from "../components/ui/Button";
import { SelectField, TextArea, TextField } from "../components/ui/Field";
import { EmptyState } from "../components/ui/States";
import { useApi, useDocumentTitle } from "../hooks/useApi";
import { ApiError, errorMessage, post } from "../lib/api";
import { formatPrice } from "../lib/format";
import { useAuth } from "../store/auth";
import { cartSubtotal, useCart } from "../store/cart";
import { useSettings } from "../store/settings";
import { toast } from "../store/toast";
import type { Address, DeliveryZone, Order } from "../types";

/* ── Carte de section ─────────────────────────────────────────── */
function SectionCard({ icon: Icon, title, children }: {
  icon: React.ElementType; title: string; children: React.ReactNode
}) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 border-b border-line bg-surface px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-plum/8">
          <Icon className="h-4 w-4 text-plum" aria-hidden />
        </div>
        <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      </div>
      <div className="space-y-4 p-6">{children}</div>
    </div>
  );
}

export default function Checkout() {
  useDocumentTitle("Commande");
  const { items, clear } = useCart();
  const user = useAuth((s) => s.user);
  const { settings } = useSettings();
  const navigate = useNavigate();

  const zones     = useApi<DeliveryZone[]>("/delivery-zones/");
  const addresses = useApi<Address[]>(user ? "/addresses/" : null);
  const key       = useRef(crypto.randomUUID());

  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState<ApiError | null>(null);
  const [f, setF] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    address_line: "", city: "", zone: "", note: "",
  });

  useEffect(() => {
    if (user) setF((p) => ({
      ...p,
      first_name:   p.first_name   || user.first_name,
      last_name:    p.last_name    || user.last_name,
      email:        p.email        || user.email,
      phone:        p.phone        || user.phone,
    }));
  }, [user]);

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF({ ...f, [k]: e.target.value });

  const subtotal    = cartSubtotal(items);
  const zone        = zones.data?.find((z) => String(z.id) === f.zone);
  const fee         = zone?.fee ?? null;
  const unknownZone = f.zone === "other";
  const total       = useMemo(() => subtotal + (fee ?? 0), [subtotal, fee]);

  /* Guards */
  if (!user && !settings.guest_checkout_enabled) {
    return (
      <div className="container-page py-20">
        <EmptyState
          title="Connexion requise"
          text="Connectez-vous ou créez un compte pour passer commande."
          action={<ButtonLink to="/connexion" state={{ from: "/commande" }}>Se connecter</ButtonLink>}
        />
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="container-page py-20">
        <EmptyState
          title="Votre panier est vide"
          action={<ButtonLink to="/boutique"><ShoppingBag className="h-4 w-4" />Voir la boutique</ButtonLink>}
        />
      </div>
    );
  }

  const fillAddress = (id: string) => {
    const a = addresses.data?.find((x) => String(x.id) === id);
    if (a) setF({ ...f, address_line: a.line1, city: a.city, phone: a.phone, zone: a.delivery_zone ? String(a.delivery_zone) : f.zone });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!f.zone) { toast.error("Choisissez votre zone de livraison."); return; }
    setBusy(true); setErr(null);
    try {
      const order = await post<Order>("/orders/", {
        items: items.map((i) => ({ product_id: i.productId, variant_id: i.variantId, quantity: i.quantity })),
        first_name: f.first_name, last_name: f.last_name, email: f.email, phone: f.phone,
        address_line: f.address_line, city: f.city,
        delivery_zone: unknownZone ? null : Number(f.zone),
        customer_note: f.note, source: "web",
      }, { "Idempotency-Key": key.current });
      clear();
      navigate(`/commande/confirmation/${order.number}`, { state: { order } });
    } catch (er) {
      if (er instanceof ApiError) setErr(er);
      toast.error(errorMessage(er));
      setBusy(false);
    }
  };

  const itemErrors = err ? ((err.errors as Record<string, unknown>).items as string[] | undefined) : undefined;

  return (
    <div className="container-page py-10">
      <h1 className="mb-8 font-display text-4xl font-bold tracking-tight">
        Finaliser la commande
      </h1>

      <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_400px]" noValidate>
        {/* ── Formulaire ──────────────────────────────────────── */}
        <div className="space-y-6">
          {!user && (
            <p className="rounded-2xl bg-blush px-4 py-3 text-sm text-muted">
              Vous avez un compte ?{" "}
              <Link to="/connexion" state={{ from: "/commande" }} className="link font-semibold">
                Connectez-vous
              </Link>{" "}
              pour retrouver vos adresses et suivre vos commandes.
            </p>
          )}

          {/* Coordonnées */}
          <SectionCard icon={User} title="Vos coordonnées">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Prénom" required value={f.first_name} onChange={set("first_name")} error={err?.field("first_name")} autoComplete="given-name" />
              <TextField label="Nom" required value={f.last_name} onChange={set("last_name")} error={err?.field("last_name")} autoComplete="family-name" />
              <TextField label="Téléphone" type="tel" required value={f.phone} onChange={set("phone")} error={err?.field("phone")} autoComplete="tel" />
              <TextField label="E-mail (facultatif)" type="email" value={f.email} onChange={set("email")} error={err?.field("email")} autoComplete="email" />
            </div>
          </SectionCard>

          {/* Livraison */}
          <SectionCard icon={MapPin} title="Adresse de livraison">
            {addresses.data && addresses.data.length > 0 && (
              <SelectField label="Utiliser une adresse enregistrée" defaultValue="" onChange={(e) => fillAddress(e.target.value)}>
                <option value="">Choisir une adresse enregistrée</option>
                {addresses.data.map((a) => (
                  <option key={a.id} value={a.id}>{a.label} : {a.line1}</option>
                ))}
              </SelectField>
            )}
            <TextField label="Adresse" required value={f.address_line} onChange={set("address_line")} error={err?.field("address_line")} autoComplete="street-address" />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Ville" value={f.city} onChange={set("city")} error={err?.field("city")} autoComplete="address-level2" />
              <SelectField label="Zone de livraison" required value={f.zone} onChange={set("zone")} error={err?.field("delivery_zone")}>
                <option value="">Choisir une zone</option>
                {zones.data?.map((z) => (
                  <option key={z.id} value={z.id}>{z.name} ({formatPrice(z.fee)})</option>
                ))}
                <option value="other">Autre zone (frais à confirmer)</option>
              </SelectField>
            </div>
            {unknownZone && (
              <div className="rounded-xl bg-blush px-4 py-3 text-sm text-muted">
                {settings.unknown_zone_policy || "Les frais de livraison vous seront confirmés par la boutique."}
              </div>
            )}
            <TextArea label="Note pour la boutique (facultatif)" rows={3} value={f.note} onChange={set("note")} />
          </SectionCard>

          {/* Paiement */}
          <SectionCard icon={CreditCard} title="Règlement">
            {settings.payment_cash_on_delivery ? (
              <div className="flex items-start gap-3 rounded-xl bg-success/6 px-4 py-3">
                <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                <p className="text-sm text-ink">
                  <span className="font-semibold">Paiement à la livraison.</span>{" "}
                  Le règlement est effectué à la réception de votre commande.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-xl bg-blush px-4 py-3">
                <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-plum" aria-hidden />
                <p className="text-sm text-muted">
                  Aucun paiement en ligne n'est demandé maintenant. La boutique vous contacte pour confirmer la commande et convenir du règlement.
                </p>
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── Récapitulatif ────────────────────────────────────── */}
        <aside className="h-fit space-y-4 rounded-3xl border border-line bg-white p-6 shadow-card lg:sticky lg:top-24">
          <h2 className="font-display text-xl font-bold">Récapitulatif</h2>

          <ul className="space-y-2.5 border-b border-line pb-4">
            {items.map((i) => (
              <li key={i.key} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate text-muted">
                  {i.name}{i.variantName ? ` (${i.variantName})` : ""} ×{i.quantity}
                </span>
                <span className="shrink-0 font-medium text-ink">{formatPrice(i.unitPrice * i.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Sous-total</span>
              <span className="font-semibold">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Livraison</span>
              <span className="font-semibold">
                {unknownZone ? "À confirmer" : fee !== null ? formatPrice(fee) : "—"}
              </span>
            </div>
          </div>

          <div className="flex justify-between rounded-2xl bg-plum/6 px-4 py-3">
            <span className="font-display text-base font-bold text-ink">Total</span>
            <span className="font-display text-xl font-bold text-plum">{formatPrice(total)}</span>
          </div>

          {itemErrors && (
            <ul role="alert" className="space-y-1 rounded-xl bg-danger/8 px-4 py-3 text-sm text-danger">
              {itemErrors.map((m) => <li key={m}>• {m}</li>)}
            </ul>
          )}

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Enregistrement en cours…" : "Confirmer la commande"}
          </Button>
          <p className="text-center text-xs text-muted">
            Le total final est recalculé par le serveur à la validation.
          </p>
        </aside>
      </form>
    </div>
  );
}
