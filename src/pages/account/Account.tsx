import {
  Heart, LockKeyhole, LogOut, MapPin, Package, UserRound,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, NavLink, Outlet, useNavigate, useParams } from "react-router-dom";

import { InvoicePrint } from "../../components/InvoicePrint";
import { ProductCard } from "../../components/ProductCard";
import { Button, ButtonLink } from "../../components/ui/Button";
import { CheckField, SelectField, TextField } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Modal";
import { EmptyState, ErrorState, Spinner } from "../../components/ui/States";
import { useApi, useDocumentTitle } from "../../hooks/useApi";
import { ApiError, del, errorMessage, patch, post, put } from "../../lib/api";
import { formatDate, formatPrice } from "../../lib/format";
import { getCommunesByRegion, SENEGAL_REGIONS } from "../../lib/senegal";
import { useAuth } from "../../store/auth";
import { useFavorites } from "../../store/favorites";
import { toast } from "../../store/toast";
import type { Address, DeliveryZone, Order, OrderListItem, Paginated, User } from "../../types";

/* ── Layout compte ────────────────────────────────────────────── */
const NAV_LINKS = [
  { to: "/compte",          label: "Tableau de bord", Icon: UserRound,   end: true  },
  { to: "/compte/profil",   label: "Mon profil",       Icon: UserRound,   end: false },
  { to: "/compte/adresses", label: "Mes adresses",     Icon: MapPin,      end: false },
  { to: "/compte/commandes",label: "Mes commandes",    Icon: Package,     end: false },
  { to: "/compte/favoris",  label: "Mes favoris",      Icon: Heart,       end: false },
  { to: "/compte/securite", label: "Sécurité",         Icon: LockKeyhole, end: false },
];

export function AccountLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <div className="container-page grid gap-8 py-10 md:grid-cols-[260px_1fr]">
      <aside className="min-w-0">
        <div className="mb-4 rounded-2xl border border-line bg-white p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-plum/10 font-display text-lg font-bold text-plum">
              {user?.first_name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{user?.first_name} {user?.last_name}</p>
              <p className="truncate text-xs text-muted">{user?.email}</p>
            </div>
          </div>
        </div>

        <nav aria-label="Espace client" className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0">
          {NAV_LINKS.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-plum text-ivory shadow-sm" : "text-ink hover:bg-blush"
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {label}
            </NavLink>
          ))}
          <button
            onClick={async () => {
              await logout();
              useFavorites.getState().reset();
              nav("/");
              toast.info("Vous êtes déconnectée.");
            }}
            className="flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-blush hover:text-danger md:mt-2"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden />
            Se déconnecter
          </button>
        </nav>
      </aside>

      <div className="min-w-0">
        <p className="sr-only">Connectée en tant que {user?.email}</p>
        <Outlet />
      </div>
    </div>
  );
}

/* ── Tableau de bord ──────────────────────────────────────────── */
export function AccountHome() {
  useDocumentTitle("Mon compte");
  const user   = useAuth((s) => s.user)!;
  const orders = useApi<Paginated<OrderListItem>>("/orders/");

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Bonjour {user.first_name}
        </h1>
        <p className="mt-1 text-sm text-muted">Retrouvez ici vos commandes, adresses et favoris.</p>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {[
          { to: "/compte/commandes", label: "Mes commandes", Icon: Package },
          { to: "/compte/adresses",  label: "Mes adresses",  Icon: MapPin  },
          { to: "/compte/favoris",   label: "Mes favoris",   Icon: Heart   },
        ].map(({ to, label, Icon }) => (
          <Link key={to} to={to} className="card flex items-center gap-3 p-4 transition-all hover:border-plum/40 hover:shadow-card-hover">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-plum/8">
              <Icon className="h-4 w-4 text-plum" aria-hidden />
            </div>
            <span className="text-sm font-semibold text-ink">{label}</span>
          </Link>
        ))}
      </div>

      <h2 className="mb-4 font-display text-xl font-bold">Dernières commandes</h2>
      {orders.loading ? <Spinner /> : orders.error ? (
        <ErrorState message={orders.error} onRetry={orders.reload} />
      ) : orders.data?.results.length ? (
        <OrdersTable orders={orders.data.results.slice(0, 3)} />
      ) : (
        <p className="text-sm text-muted">Vous n'avez pas encore passé de commande.</p>
      )}
    </>
  );
}

/* ── Tableau commandes ────────────────────────────────────────── */
function OrdersTable({ orders }: { orders: OrderListItem[] }) {
  return (
    <ul className="space-y-3">
      {orders.map((o) => (
        <li key={o.number}>
          <Link
            to={`/compte/commandes/${o.number}`}
            className="card flex flex-wrap items-center justify-between gap-3 p-4 transition-all hover:border-plum/40 hover:shadow-card"
          >
            <div>
              <p className="font-semibold text-ink">{o.number}</p>
              <p className="text-xs text-muted">
                {formatDate(o.created_at)} · {o.items_count} article{o.items_count > 1 ? "s" : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display font-bold text-plum">{formatPrice(o.total)}</p>
              <p className="text-xs text-muted">{o.status_label} · {o.payment_status_label}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* ── Mes commandes ────────────────────────────────────────────── */
export function Orders() {
  useDocumentTitle("Mes commandes");
  const { data, loading, error, reload } = useApi<Paginated<OrderListItem>>("/orders/");
  return (
    <>
      <h1 className="mb-6 font-display text-3xl font-bold tracking-tight">Mes commandes</h1>
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> :
        data?.results.length ? <OrdersTable orders={data.results} /> : (
          <EmptyState
            title="Aucune commande"
            text="Vos commandes apparaîtront ici."
            action={<ButtonLink to="/boutique">Voir la boutique</ButtonLink>}
          />
        )}
    </>
  );
}

/* ── Détail commande ──────────────────────────────────────────── */

/** Couleur et libellé du badge paiement selon le statut. */
function PaymentBadge({ status, label }: { status: string; label: string }) {
  const cls =
    status === "paid"     ? "bg-success/10 text-success" :
    status === "refunded" ? "bg-champagne/15 text-champagne/80" :
    "bg-danger/10 text-danger";
  return <span className={`badge ${cls}`}>{label}</span>;
}

/** Icône de la timeline selon le statut de commande. */
const STATUS_ICON: Record<string, string> = {
  pending:   "bg-yellow-400",
  confirmed: "bg-blue-400",
  preparing: "bg-purple-400",
  shipped:   "bg-indigo-400",
  delivered: "bg-success",
  cancelled: "bg-danger",
};

export function OrderDetail() {
  const { number } = useParams();
  useDocumentTitle(`Commande ${number}`);
  const { data: o, loading, error, reload } = useApi<Order>(`/orders/${number}/`);
  const [busy, setBusy]                     = useState(false);
  const [confirmCancel, setConfirmCancel]   = useState(false);

  if (loading) return <Spinner />;
  if (error || !o) return <ErrorState message={error ?? "Commande introuvable."} onRetry={reload} />;

  const cancel = async () => {
    setBusy(true);
    setConfirmCancel(false);
    try {
      await post(`/orders/${o.number}/cancel/`);
      toast.success("Commande annulée. Le stock a été restitué.");
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* ── En-tête ── */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Commande {o.number}
          </h1>
          <p className="mt-1 text-sm text-muted">Passée le {formatDate(o.created_at)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge badge-plum">{o.status_label}</span>
          <PaymentBadge status={o.payment_status} label={o.payment_status_label} />
        </div>
      </div>

      {/* ── Méthode de paiement (si renseignée) ── */}
      {o.payment_method && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
          <span className="text-muted">Mode de règlement :</span>
          <span className="font-semibold text-ink">{o.payment_method_label}</span>
        </div>
      )}

      {/* ── Informations de suivi ── */}
      {o.tracking_info && (
        <div className="mb-4 rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
          <span className="font-semibold text-ink">Suivi : </span>
          <span className="text-muted">{o.tracking_info}</span>
        </div>
      )}

      {/* ── Articles ── */}
      <div className="card overflow-hidden">
        <ul className="divide-y divide-line">
          {o.items.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
              <span className="text-ink">
                {i.product_name}
                {i.variant_name && <span className="ml-2 text-muted">({i.variant_name})</span>}
                <span className="ml-1 text-muted">×{i.quantity}</span>
              </span>
              <span className="shrink-0 font-semibold">{formatPrice(i.line_total)}</span>
            </li>
          ))}
        </ul>

        {/* Totaux */}
        <div className="space-y-2 border-t border-line bg-surface px-5 py-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Sous-total</span>
            <span className="font-medium">{formatPrice(o.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Livraison ({o.delivery_zone_name})</span>
            <span className="font-medium">
              {o.delivery_fee_pending ? "À confirmer" : formatPrice(o.delivery_fee)}
            </span>
          </div>
          <div className="flex justify-between pt-1 text-base font-bold">
            <span>Total</span>
            <span className="text-plum">{formatPrice(o.total)}</span>
          </div>
        </div>
      </div>

      {/* ── Facture ── */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-ink">Facture</p>
          <p className="text-xs text-muted">
            Générez et imprimez votre facture ou enregistrez-la en PDF.
          </p>
        </div>
        <InvoicePrint order={o} />
      </div>

      {/* ── Timeline historique ── */}
      <div className="mt-8">
        <h2 className="mb-5 font-display text-xl font-bold">Suivi de la commande</h2>
        <ol className="relative space-y-5 border-l-2 border-line pl-7">
          {o.history.map((h, i) => (
            <li key={i} className="relative">
              <div
                className={`absolute -left-[1.625rem] top-1 h-3.5 w-3.5 rounded-full border-2 border-white ${STATUS_ICON[h.status] ?? "bg-muted"}`}
              />
              <div className="rounded-xl border border-line bg-white px-4 py-3 shadow-xs">
                <p className="text-sm font-semibold text-ink">{h.status_label}</p>
                <p className="text-xs text-muted">{formatDate(h.created_at)}</p>
                {h.note && <p className="mt-1 text-xs text-muted">{h.note}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* ── Annulation ── */}
      {o.status === "pending" && (
        <>
          <Button
            variant="danger"
            className="mt-8"
            onClick={() => setConfirmCancel(true)}
            disabled={busy}
          >
            Annuler la commande
          </Button>

          <Modal
            open={confirmCancel}
            onClose={() => setConfirmCancel(false)}
            title="Annuler la commande"
          >
            <p className="text-sm text-muted">
              Êtes-vous sûre de vouloir annuler la commande{" "}
              <span className="font-semibold text-ink">{o.number}</span> ?
              Le stock sera restitué automatiquement.
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="danger" className="flex-1" onClick={cancel} disabled={busy}>
                {busy ? "Annulation…" : "Oui, annuler"}
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmCancel(false)}>
                Garder la commande
              </Button>
            </div>
          </Modal>
        </>
      )}
    </>
  );
}

/* ── Mon profil ───────────────────────────────────────────────── */
export function Profile() {
  useDocumentTitle("Mon profil");
  const { user, setUser } = useAuth();
  const [f, setF] = useState({
    first_name: user!.first_name,
    last_name:  user!.last_name,
    phone:      user!.phone,
  });
  const [err,  setErr]  = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      setUser(await patch<User>("/auth/me/", f));
      toast.success("Profil mis à jour avec succès.");
    } catch (er) {
      if (er instanceof ApiError) setErr(er);
      toast.error(errorMessage(er));
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="max-w-md space-y-5" noValidate>
      <h1 className="font-display text-3xl font-bold tracking-tight">Mon profil</h1>
      <TextField label="Prénom" value={f.first_name} onChange={(e) => setF({ ...f, first_name: e.target.value })} error={err?.field("first_name")} />
      <TextField label="Nom" value={f.last_name} onChange={(e) => setF({ ...f, last_name: e.target.value })} error={err?.field("last_name")} />
      <TextField label="Téléphone" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} error={err?.field("phone")} hint="Format international : +221 7X XXX XX XX" />
      <TextField label="E-mail" value={user!.email} disabled hint="L'adresse e-mail ne peut pas être modifiée." readOnly />
      <Button type="submit" disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer"}</Button>
    </form>
  );
}

/* ── Adresses ─────────────────────────────────────────────────── */
const EMPTY_ADDR = {
  label: "Domicile",
  recipient_name: "",
  phone: "",
  line1: "",
  region: "Dakar",
  city: "",
  delivery_zone: "",
  is_default: false,
};

export function Addresses() {
  useDocumentTitle("Mes adresses");
  const { data, loading, error, reload } = useApi<Address[]>("/addresses/");
  const zones = useApi<DeliveryZone[]>("/delivery-zones/");
  const [editing, setEditing] = useState<(typeof EMPTY_ADDR & { id?: number }) | null>(null);
  const [err, setErr]         = useState<ApiError | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setErr(null);
    // On compose city = "Commune/Quartier, Région" pour conserver la lisibilité
    const cityFull = editing.city
      ? `${editing.city}, ${editing.region}`
      : editing.region;
    const body = {
      ...editing,
      city: cityFull,
      delivery_zone: editing.delivery_zone ? Number(editing.delivery_zone) : null,
    };
    try {
      if (editing.id) await put(`/addresses/${editing.id}/`, body);
      else await post("/addresses/", body);
      toast.success("Adresse enregistrée.");
      setEditing(null);
      reload();
    } catch (er) {
      if (er instanceof ApiError) setErr(er);
      toast.error(errorMessage(er));
    }
  };

  const remove = async (id: number) => {
    setConfirmDelete(null);
    try {
      await del(`/addresses/${id}/`);
      toast.success("Adresse supprimée.");
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const set = (k: keyof typeof EMPTY_ADDR) => (e: { target: { value: string } }) =>
    setEditing({ ...editing!, [k]: e.target.value });

  // Communes disponibles pour la région sélectionnée
  const communes = editing ? getCommunesByRegion(editing.region) : [];

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold tracking-tight">Mes adresses</h1>
        <Button onClick={() => { setErr(null); setEditing(EMPTY_ADDR); }}>Ajouter</Button>
      </div>

      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> :
        data?.length ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {data.map((a) => (
              <li key={a.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-ink">
                    {a.label}
                    {a.is_default && <span className="ml-2 badge badge-plum">Par défaut</span>}
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted">{a.recipient_name} · {a.phone}</p>
                <p className="text-sm text-muted">
                  {a.line1}, {a.city}
                  {a.delivery_zone_name ? ` (${a.delivery_zone_name})` : ""}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setErr(null);
                      setEditing({
                        ...EMPTY_ADDR,
                        ...a,
                        region: "Dakar",
                        delivery_zone: a.delivery_zone ? String(a.delivery_zone) : "",
                      });
                    }}
                  >
                    Modifier
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirmDelete(a.id)}>
                    Supprimer
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Aucune adresse enregistrée"
            text="Ajoutez une adresse pour commander plus vite."
          />
        )}

      {/* Modal formulaire adresse */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Modifier l'adresse" : "Nouvelle adresse"}
      >
        {editing && (
          <form onSubmit={save} className="space-y-4" noValidate>
            <TextField
              label="Libellé (ex: Domicile, Bureau)"
              value={editing.label}
              onChange={set("label")}
              error={err?.field("label")}
              placeholder="Domicile"
            />
            <TextField
              label="Destinataire"
              value={editing.recipient_name}
              onChange={set("recipient_name")}
              error={err?.field("recipient_name")}
              placeholder="Nom complet"
            />
            <TextField
              label="Téléphone"
              type="tel"
              value={editing.phone}
              onChange={set("phone")}
              error={err?.field("phone")}
              placeholder="+221 7X XXX XX XX"
            />
            <TextField
              label="Adresse (rue, numéro, bâtiment…)"
              value={editing.line1}
              onChange={set("line1")}
              error={err?.field("line1")}
              placeholder="Ex : Rue 10, Villa 3"
            />

            {/* Région */}
            <SelectField
              label="Région"
              value={editing.region}
              onChange={(e) => setEditing({ ...editing, region: e.target.value, city: "" })}
            >
              {SENEGAL_REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </SelectField>

            {/* Commune / Quartier — affiché seulement si des options existent */}
            {communes.length > 0 ? (
              <SelectField
                label="Commune / Quartier"
                value={editing.city}
                onChange={set("city")}
                error={err?.field("city")}
              >
                <option value="">Choisir un quartier</option>
                {communes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </SelectField>
            ) : (
              <TextField
                label="Ville / Commune"
                value={editing.city}
                onChange={set("city")}
                error={err?.field("city")}
                placeholder="Ex : Centre-ville"
              />
            )}

            <SelectField
              label="Zone de livraison"
              value={editing.delivery_zone}
              onChange={set("delivery_zone")}
            >
              <option value="">Non précisée</option>
              {zones.data?.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </SelectField>

            <CheckField
              label="Adresse par défaut"
              checked={editing.is_default}
              onChange={(e) => setEditing({ ...editing, is_default: e.target.checked })}
            />

            <Button type="submit" className="w-full">
              Enregistrer l'adresse
            </Button>
          </form>
        )}
      </Modal>

      {/* Modal confirmation suppression — remplace window.confirm */}
      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Supprimer l'adresse"
      >
        <p className="text-sm text-muted">
          Cette adresse sera définitivement supprimée. Cette action est irréversible.
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => confirmDelete !== null && remove(confirmDelete)}
          >
            Supprimer
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setConfirmDelete(null)}
          >
            Annuler
          </Button>
        </div>
      </Modal>
    </>
  );
}

/* ── Favoris ──────────────────────────────────────────────────── */
export function Favorites() {
  useDocumentTitle("Mes favoris");
  const { data, loading, error, reload } = useApi<{ id: number; product: import("../../types").ProductListItem }[]>("/favorites/");
  return (
    <>
      <h1 className="mb-6 font-display text-3xl font-bold tracking-tight">Mes favoris</h1>
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> :
        data?.length ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {data.map((f) => <ProductCard key={f.id} product={f.product} />)}
          </div>
        ) : (
          <EmptyState
            title="Aucun favori"
            text="Touchez le cœur sur un produit pour le retrouver ici."
            action={<ButtonLink to="/boutique">Voir la boutique</ButtonLink>}
          />
        )}
    </>
  );
}

/* ── Sécurité ─────────────────────────────────────────────────── */
export function Security() {
  useDocumentTitle("Sécurité du compte");
  const [f, setF] = useState({ current_password: "", new_password: "" });
  const [err,  setErr]  = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      await post("/auth/change-password/", f);
      toast.success("Mot de passe mis à jour avec succès.");
      setF({ current_password: "", new_password: "" });
    } catch (er) {
      if (er instanceof ApiError) setErr(er);
      toast.error(errorMessage(er));
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="max-w-md space-y-5" noValidate>
      <h1 className="font-display text-3xl font-bold tracking-tight">Sécurité du compte</h1>
      <TextField
        label="Mot de passe actuel"
        type="password"
        autoComplete="current-password"
        value={f.current_password}
        onChange={(e) => setF({ ...f, current_password: e.target.value })}
        error={err?.field("current_password")}
      />
      <TextField
        label="Nouveau mot de passe"
        type="password"
        autoComplete="new-password"
        value={f.new_password}
        onChange={(e) => setF({ ...f, new_password: e.target.value })}
        error={err?.field("new_password")}
        hint="8 caractères minimum, ni trop courant, ni uniquement numérique."
      />
      <Button type="submit" disabled={busy}>
        {busy ? "Enregistrement…" : "Changer le mot de passe"}
      </Button>
    </form>
  );
}
