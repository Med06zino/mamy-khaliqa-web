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

export default function Checkout() {
  useDocumentTitle("Commande");
  const { items, clear } = useCart();
  const user = useAuth((s) => s.user);
  const { settings } = useSettings();
  const navigate = useNavigate();
  const zones = useApi<DeliveryZone[]>("/delivery-zones/");
  const addresses = useApi<Address[]>(user ? "/addresses/" : null);
  const key = useRef(crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<ApiError | null>(null);
  const [f, setF] = useState({ first_name: "", last_name: "", email: "", phone: "", address_line: "", city: "", zone: "", note: "" });

  useEffect(() => {
    if (user) setF((p) => ({ ...p, first_name: p.first_name || user.first_name, last_name: p.last_name || user.last_name, email: p.email || user.email, phone: p.phone || user.phone }));
  }, [user]);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const subtotal = cartSubtotal(items);
  const zone = zones.data?.find((z) => String(z.id) === f.zone);
  const fee = zone?.fee ?? null;
  const unknownZone = f.zone === "other";
  const total = useMemo(() => subtotal + (fee ?? 0), [subtotal, fee]);

  if (!user && !settings.guest_checkout_enabled)
    return <div className="container-page"><EmptyState title="Connexion requise" text="Connectez-vous ou créez un compte pour passer commande." action={<ButtonLink to="/connexion" state={{ from: "/commande" }}>Se connecter</ButtonLink>} /></div>;
  if (items.length === 0)
    return <div className="container-page"><EmptyState title="Votre panier est vide" action={<ButtonLink to="/boutique">Voir la boutique</ButtonLink>} /></div>;

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
        first_name: f.first_name, last_name: f.last_name, email: f.email, phone: f.phone, address_line: f.address_line,
        city: f.city, delivery_zone: unknownZone ? null : Number(f.zone), customer_note: f.note, source: "web",
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
      <h1 className="mb-8 text-4xl">Finaliser la commande</h1>
      <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_380px]" noValidate>
        <div className="space-y-6">
          {!user && <p className="text-sm text-muted">Vous avez un compte ? <Link to="/connexion" state={{ from: "/commande" }} className="link">Connectez-vous</Link> pour retrouver vos adresses et suivre vos commandes.</p>}
          <section className="card space-y-4 p-6">
            <h2 className="text-2xl">Vos coordonnées</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Prénom" required value={f.first_name} onChange={set("first_name")} error={err?.field("first_name")} autoComplete="given-name" />
              <TextField label="Nom" required value={f.last_name} onChange={set("last_name")} error={err?.field("last_name")} autoComplete="family-name" />
              <TextField label="Téléphone" type="tel" required value={f.phone} onChange={set("phone")} error={err?.field("phone")} autoComplete="tel" />
              <TextField label="E-mail (facultatif)" type="email" value={f.email} onChange={set("email")} error={err?.field("email")} autoComplete="email" />
            </div>
          </section>
          <section className="card space-y-4 p-6">
            <h2 className="text-2xl">Livraison</h2>
            {addresses.data && addresses.data.length > 0 && (
              <SelectField label="Utiliser une adresse enregistrée" defaultValue="" onChange={(e) => fillAddress(e.target.value)}>
                <option value="">Choisir une adresse</option>
                {addresses.data.map((a) => <option key={a.id} value={a.id}>{a.label} : {a.line1}</option>)}
              </SelectField>
            )}
            <TextField label="Adresse" required value={f.address_line} onChange={set("address_line")} error={err?.field("address_line")} autoComplete="street-address" />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Ville" value={f.city} onChange={set("city")} error={err?.field("city")} />
              <SelectField label="Zone de livraison" required value={f.zone} onChange={set("zone")} error={err?.field("delivery_zone")}>
                <option value="">Choisir une zone</option>
                {zones.data?.map((z) => <option key={z.id} value={z.id}>{z.name} ({formatPrice(z.fee)})</option>)}
                <option value="other">Autre zone (frais à confirmer)</option>
              </SelectField>
            </div>
            {unknownZone && <p className="rounded-lg bg-blush p-3 text-sm text-muted">{settings.unknown_zone_policy || "Les frais de livraison vous seront confirmés par la boutique."}</p>}
            <TextArea label="Note pour la boutique (facultatif)" rows={3} value={f.note} onChange={set("note")} />
          </section>
          <section className="card p-6">
            <h2 className="mb-2 text-2xl">Règlement</h2>
            {settings.payment_cash_on_delivery
              ? <p className="text-sm text-muted">Paiement à la livraison. Le règlement est effectué à la réception de votre commande.</p>
              : <p className="text-sm text-muted">Aucun paiement en ligne n'est demandé maintenant. La boutique vous contacte pour confirmer la commande et convenir du règlement.</p>}
          </section>
        </div>
        <aside className="card h-fit space-y-3 p-6">
          <h2 className="text-2xl">Récapitulatif</h2>
          <ul className="divide-y divide-line text-sm">
            {items.map((i) => <li key={i.key} className="flex justify-between gap-3 py-2"><span>{i.name}{i.variantName ? ` (${i.variantName})` : ""} x{i.quantity}</span><span>{formatPrice(i.unitPrice * i.quantity)}</span></li>)}
          </ul>
          <div className="flex justify-between text-sm"><span className="text-muted">Sous-total</span><span>{formatPrice(subtotal)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted">Livraison</span><span>{unknownZone ? "À confirmer" : fee !== null ? formatPrice(fee) : "Choisissez une zone"}</span></div>
          <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold"><span>Total</span><span className="text-plum">{formatPrice(total)}</span></div>
          {itemErrors && <ul role="alert" className="space-y-1 rounded-lg bg-blush p-3 text-sm text-danger">{itemErrors.map((m) => <li key={m}>{m}</li>)}</ul>}
          <Button type="submit" disabled={busy} className="w-full">{busy ? "Enregistrement en cours" : "Confirmer la commande"}</Button>
          <p className="text-xs text-muted">Le total final est recalculé par le serveur à la validation.</p>
        </aside>
      </form>
    </div>
  );
}
