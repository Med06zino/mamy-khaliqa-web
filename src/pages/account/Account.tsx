import { Heart, LockKeyhole, LogOut, MapPin, Package, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, NavLink, Outlet, useNavigate, useParams } from "react-router-dom";

import { ProductCard } from "../../components/ProductCard";
import { Button, ButtonLink } from "../../components/ui/Button";
import { CheckField, SelectField, TextField } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Modal";
import { EmptyState, ErrorState, Spinner } from "../../components/ui/States";
import { useApi, useDocumentTitle } from "../../hooks/useApi";
import { ApiError, del, errorMessage, patch, post, put } from "../../lib/api";
import { formatDate, formatPrice } from "../../lib/format";
import { useAuth } from "../../store/auth";
import { useFavorites } from "../../store/favorites";
import { toast } from "../../store/toast";
import type { Address, DeliveryZone, Order, OrderListItem, Paginated, User } from "../../types";

export function AccountLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const links = [
    { to: "/compte", label: "Tableau de bord", Icon: UserRound, end: true }, { to: "/compte/profil", label: "Mon profil", Icon: UserRound, end: false },
    { to: "/compte/adresses", label: "Mes adresses", Icon: MapPin, end: false }, { to: "/compte/commandes", label: "Mes commandes", Icon: Package, end: false },
    { to: "/compte/favoris", label: "Mes favoris", Icon: Heart, end: false }, { to: "/compte/securite", label: "Sécurité", Icon: LockKeyhole, end: false },
  ];
  return (
    <div className="container-page grid gap-8 py-10 md:grid-cols-[240px_1fr]">
      <nav aria-label="Espace client" className="flex gap-2 overflow-x-auto md:flex-col">
        {links.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm md:rounded-lg ${isActive ? "bg-plum text-ivory" : "hover:bg-blush"}`}>
            <Icon className="h-4 w-4" aria-hidden />{label}
          </NavLink>
        ))}
        <button onClick={async () => { await logout(); useFavorites.getState().reset(); nav("/"); }} className="flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm hover:bg-blush md:rounded-lg"><LogOut className="h-4 w-4" aria-hidden />Se déconnecter</button>
      </nav>
      <div><p className="sr-only">Connectée en tant que {user?.email}</p><Outlet /></div>
    </div>
  );
}

export function AccountHome() {
  useDocumentTitle("Mon compte");
  const user = useAuth((s) => s.user)!;
  const orders = useApi<Paginated<OrderListItem>>("/orders/");
  return (
    <>
      <h1 className="text-3xl">Bonjour {user.first_name}</h1>
      <p className="mt-1 text-sm text-muted">Retrouvez ici vos commandes, adresses et favoris.</p>
      <h2 className="mb-3 mt-8 text-2xl">Dernières commandes</h2>
      {orders.loading ? <Spinner /> : orders.error ? <ErrorState message={orders.error} onRetry={orders.reload} /> :
        orders.data && orders.data.results.length ? <OrdersTable orders={orders.data.results.slice(0, 3)} /> : <p className="text-sm text-muted">Vous n'avez pas encore passé de commande.</p>}
    </>
  );
}

function OrdersTable({ orders }: { orders: OrderListItem[] }) {
  return (
    <ul className="space-y-3">
      {orders.map((o) => (
        <li key={o.number}>
          <Link to={`/compte/commandes/${o.number}`} className="card flex flex-wrap items-center justify-between gap-3 p-4 hover:border-plum">
            <div><p className="font-medium">{o.number}</p><p className="text-xs text-muted">{formatDate(o.created_at)} · {o.items_count} article{o.items_count > 1 ? "s" : ""}</p></div>
            <div className="text-right"><p className="font-semibold text-plum">{formatPrice(o.total)}</p><p className="text-xs">{o.status_label} · {o.payment_status_label}</p></div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Orders() {
  useDocumentTitle("Mes commandes");
  const { data, loading, error, reload } = useApi<Paginated<OrderListItem>>("/orders/");
  return (
    <>
      <h1 className="mb-6 text-3xl">Mes commandes</h1>
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> :
        data && data.results.length ? <OrdersTable orders={data.results} /> :
          <EmptyState title="Aucune commande" text="Vos commandes apparaîtront ici." action={<ButtonLink to="/boutique">Voir la boutique</ButtonLink>} />}
    </>
  );
}

export function OrderDetail() {
  const { number } = useParams();
  useDocumentTitle(`Commande ${number}`);
  const { data: o, loading, error, reload } = useApi<Order>(`/orders/${number}/`);
  const [busy, setBusy] = useState(false);
  if (loading) return <Spinner />;
  if (error || !o) return <ErrorState message={error ?? "Commande introuvable."} onRetry={reload} />;
  const cancel = async () => {
    if (!window.confirm("Annuler cette commande ?")) return;
    setBusy(true);
    try { await post(`/orders/${o.number}/cancel/`); toast.success("Commande annulée."); reload(); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };
  return (
    <>
      <h1 className="text-3xl">Commande {o.number}</h1>
      <p className="mt-1 text-sm text-muted">Passée le {formatDate(o.created_at)}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-sm"><span className="rounded-full bg-blush px-3 py-1">{o.status_label}</span><span className="rounded-full border border-line px-3 py-1">{o.payment_status_label}</span></div>
      {o.tracking_info && <p className="mt-3 text-sm"><span className="font-medium">Suivi :</span> {o.tracking_info}</p>}
      <div className="card mt-6 p-5">
        <ul className="divide-y divide-line text-sm">{o.items.map((i) => <li key={i.id} className="flex justify-between gap-3 py-2"><span>{i.product_name}{i.variant_name ? ` (${i.variant_name})` : ""} x{i.quantity}</span><span>{formatPrice(i.line_total)}</span></li>)}</ul>
        <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><span className="text-muted">Sous-total</span><span>{formatPrice(o.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted">Livraison ({o.delivery_zone_name})</span><span>{o.delivery_fee_pending ? "À confirmer" : formatPrice(o.delivery_fee)}</span></div>
          <div className="flex justify-between text-base font-semibold"><span>Total</span><span className="text-plum">{formatPrice(o.total)}</span></div>
        </div>
      </div>
      <h2 className="mb-3 mt-8 text-2xl">Historique</h2>
      <ol className="space-y-2 border-l border-line pl-4 text-sm">{o.history.map((h, i) => <li key={i}><span className="font-medium">{h.status_label}</span> <span className="text-muted">· {formatDate(h.created_at)}</span>{h.note && <p className="text-muted">{h.note}</p>}</li>)}</ol>
      {o.status === "pending" && <Button variant="danger" className="mt-6" onClick={cancel} disabled={busy}>Annuler la commande</Button>}
    </>
  );
}

export function Profile() {
  useDocumentTitle("Mon profil");
  const { user, setUser } = useAuth();
  const [f, setF] = useState({ first_name: user!.first_name, last_name: user!.last_name, phone: user!.phone });
  const [err, setErr] = useState<ApiError | null>(null); const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try { setUser(await patch<User>("/auth/me/", f)); toast.success("Profil mis à jour."); } catch (er) { if (er instanceof ApiError) setErr(er); toast.error(errorMessage(er)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="max-w-md space-y-4" noValidate>
      <h1 className="text-3xl">Mon profil</h1>
      <TextField label="Prénom" value={f.first_name} onChange={(e) => setF({ ...f, first_name: e.target.value })} error={err?.field("first_name")} />
      <TextField label="Nom" value={f.last_name} onChange={(e) => setF({ ...f, last_name: e.target.value })} error={err?.field("last_name")} />
      <TextField label="Téléphone" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} error={err?.field("phone")} />
      <TextField label="E-mail" value={user!.email} disabled hint="L'adresse e-mail ne peut pas être modifiée." readOnly />
      <Button type="submit" disabled={busy}>Enregistrer</Button>
    </form>
  );
}

const EMPTY_ADDR = { label: "Domicile", recipient_name: "", phone: "", line1: "", city: "", delivery_zone: "", is_default: false };
export function Addresses() {
  useDocumentTitle("Mes adresses");
  const { data, loading, error, reload } = useApi<Address[]>("/addresses/");
  const zones = useApi<DeliveryZone[]>("/delivery-zones/");
  const [editing, setEditing] = useState<(typeof EMPTY_ADDR & { id?: number }) | null>(null);
  const [err, setErr] = useState<ApiError | null>(null);
  const save = async (e: FormEvent) => {
    e.preventDefault(); if (!editing) return; setErr(null);
    const body = { ...editing, delivery_zone: editing.delivery_zone ? Number(editing.delivery_zone) : null };
    try { if (editing.id) await put(`/addresses/${editing.id}/`, body); else await post("/addresses/", body); toast.success("Adresse enregistrée."); setEditing(null); reload(); }
    catch (er) { if (er instanceof ApiError) setErr(er); toast.error(errorMessage(er)); }
  };
  const remove = async (id: number) => { if (!window.confirm("Supprimer cette adresse ?")) return; try { await del(`/addresses/${id}/`); reload(); } catch (e) { toast.error(errorMessage(e)); } };
  const set = (k: keyof typeof EMPTY_ADDR) => (e: { target: { value: string } }) => setEditing({ ...editing!, [k]: e.target.value });
  return (
    <>
      <div className="mb-6 flex items-center justify-between"><h1 className="text-3xl">Mes adresses</h1><Button onClick={() => { setErr(null); setEditing(EMPTY_ADDR); }}>Ajouter une adresse</Button></div>
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : data && data.length ? (
        <ul className="grid gap-4 sm:grid-cols-2">{data.map((a) => (
          <li key={a.id} className="card p-4 text-sm">
            <p className="font-medium">{a.label}{a.is_default && <span className="ml-2 rounded-full bg-blush px-2 py-0.5 text-xs">Par défaut</span>}</p>
            <p>{a.recipient_name} · {a.phone}</p><p className="text-muted">{a.line1}, {a.city}{a.delivery_zone_name ? ` (${a.delivery_zone_name})` : ""}</p>
            <div className="mt-3 flex gap-2"><Button variant="secondary" onClick={() => { setErr(null); setEditing({ ...a, delivery_zone: a.delivery_zone ? String(a.delivery_zone) : "" }); }}>Modifier</Button><Button variant="ghost" onClick={() => remove(a.id)}>Supprimer</Button></div>
          </li>))}</ul>
      ) : <EmptyState title="Aucune adresse enregistrée" text="Ajoutez une adresse pour commander plus vite." />}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Modifier l'adresse" : "Nouvelle adresse"}>
        {editing && (
          <form onSubmit={save} className="space-y-4" noValidate>
            <TextField label="Libellé" value={editing.label} onChange={set("label")} error={err?.field("label")} />
            <TextField label="Destinataire" value={editing.recipient_name} onChange={set("recipient_name")} error={err?.field("recipient_name")} />
            <TextField label="Téléphone" type="tel" value={editing.phone} onChange={set("phone")} error={err?.field("phone")} />
            <TextField label="Adresse" value={editing.line1} onChange={set("line1")} error={err?.field("line1")} />
            <TextField label="Ville" value={editing.city} onChange={set("city")} error={err?.field("city")} />
            <SelectField label="Zone de livraison" value={editing.delivery_zone} onChange={set("delivery_zone")}><option value="">Non précisée</option>{zones.data?.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}</SelectField>
            <CheckField label="Adresse par défaut" checked={editing.is_default} onChange={(e) => setEditing({ ...editing, is_default: e.target.checked })} />
            <Button type="submit" className="w-full">Enregistrer l'adresse</Button>
          </form>
        )}
      </Modal>
    </>
  );
}

export function Favorites() {
  useDocumentTitle("Mes favoris");
  const { data, loading, error, reload } = useApi<{ id: number; product: import("../../types").ProductListItem }[]>("/favorites/");
  return (
    <>
      <h1 className="mb-6 text-3xl">Mes favoris</h1>
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : data && data.length ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {data.map((f) => <ProductCard key={f.id} product={f.product} />)}
        </div>
      ) : (
        <EmptyState title="Aucun favori" text="Touchez le coeur sur un produit pour le retrouver ici." action={<ButtonLink to="/boutique">Voir la boutique</ButtonLink>} />
      )}
    </>
  );
}

export function Security() {
  useDocumentTitle("Sécurité du compte");
  const [f, setF] = useState({ current_password: "", new_password: "" });
  const [err, setErr] = useState<ApiError | null>(null); const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try { await post("/auth/change-password/", f); toast.success("Mot de passe mis à jour."); setF({ current_password: "", new_password: "" }); }
    catch (er) { if (er instanceof ApiError) setErr(er); toast.error(errorMessage(er)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="max-w-md space-y-4" noValidate>
      <h1 className="text-3xl">Sécurité du compte</h1>
      <TextField label="Mot de passe actuel" type="password" autoComplete="current-password" value={f.current_password} onChange={(e) => setF({ ...f, current_password: e.target.value })} error={err?.field("current_password")} />
      <TextField label="Nouveau mot de passe" type="password" autoComplete="new-password" value={f.new_password} onChange={(e) => setF({ ...f, new_password: e.target.value })} error={err?.field("new_password")} hint="8 caractères minimum, ni trop courant, ni uniquement numérique." />
      <Button type="submit" disabled={busy}>Changer le mot de passe</Button>
    </form>
  );
}
