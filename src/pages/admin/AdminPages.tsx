import { ImagePlus, Pencil, Plus, Star, Trash2, TriangleAlert, Warehouse } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";

import { Button } from "../../components/ui/Button";
import { CheckField, SelectField, TextArea, TextField } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { EmptyState, ErrorState, Spinner } from "../../components/ui/States";
import { useApi, useDocumentTitle } from "../../hooks/useApi";
import { ApiError, del, errorMessage, get, patch, post } from "../../lib/api";
import { formatDate, formatPrice } from "../../lib/format";
import { toast } from "../../store/toast";
import type {
  AdminBanner, Category, Dashboard as Dash, DeliveryZone,
  Order, OrderListItem, Paginated, StoreSettings,
} from "../../types";

/* ─── Helpers visuels ────────────────────────────────────────── */
const PageTitle = ({ children }: { children: ReactNode }) => (
  <h1 className="mb-6 font-display text-2xl font-bold tracking-tight text-white">{children}</h1>
);

function AdminTable({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-white/8">
            <tr>
              {head.map((h) => (
                <th key={h} scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/40">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/6 [&_td]:px-4 [&_td]:py-3 [&_td]:text-white/80">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/8 bg-white/4 p-5 ${className}`}>
      {children}
    </div>
  );
}

const useDebounced = (initial = "") => {
  const [v, setV] = useState(initial);
  return [v, setV] as const;
};

/* ─── DASHBOARD ──────────────────────────────────────────────── */
export function AdminDashboard() {
  useDocumentTitle("Tableau de bord");
  const { data: d, loading, error, reload } = useApi<Dash>("/admin/dashboard/");

  if (loading) return <Spinner label="Chargement du tableau de bord…" />;
  if (error || !d) return <ErrorState message={error ?? "Erreur"} onRetry={reload} />;

  const stats: { label: string; value: string | number; accent?: boolean }[] = [
    { label: "Commandes au total",    value: d.orders_total },
    { label: "En attente",            value: d.orders_pending,     accent: d.orders_pending > 0 },
    { label: "En cours",              value: d.orders_in_progress  },
    { label: "Livrées",               value: d.orders_delivered    },
    { label: "Chiffre d'affaires",    value: formatPrice(d.revenue_collected), accent: true },
    { label: "Produits actifs",       value: d.products_active     },
    { label: "En rupture de stock",   value: d.products_out_of_stock, accent: d.products_out_of_stock > 0 },
    { label: "Stock faible",          value: d.products_low_stock, accent: d.products_low_stock > 0 },
  ];

  return (
    <>
      <PageTitle>Tableau de bord</PageTitle>

      {/* Statistiques dynamiques — toutes issues de l'API */}
      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, accent }) => (
          <AdminCard key={label}>
            <dt className="text-xs font-semibold uppercase tracking-wider text-white/40">{label}</dt>
            <dd className={`mt-2 font-display text-2xl font-bold ${accent ? "text-champagne" : "text-white"}`}>
              {value}
            </dd>
          </AdminCard>
        ))}
      </dl>

      {/* Top produits */}
      <h2 className="mb-4 mt-10 font-display text-lg font-bold text-white">Produits les plus vendus</h2>
      {d.top_products.length ? (
        <AdminTable head={["Produit", "Quantité vendue"]}>
          {d.top_products.map((t, i) => (
            <tr key={t.product_name}>
              <td>
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-plum/20 text-xs font-bold text-plum-light">
                    {i + 1}
                  </span>
                  {t.product_name}
                </div>
              </td>
              <td className="font-semibold text-champagne">{t.sold}</td>
            </tr>
          ))}
        </AdminTable>
      ) : (
        <p className="rounded-xl bg-white/4 px-4 py-3 text-sm text-white/40">
          Aucune vente enregistrée pour le moment.
        </p>
      )}

      <p className="mt-4 text-xs text-white/30">
        Le chiffre d'affaires ne compte que les commandes marquées comme payées.
      </p>
    </>
  );
}

/* ─── PRODUCTS ───────────────────────────────────────────────── */
interface AdminProduct {
  id: number; category: number; category_name: string; name: string; slug: string;
  sku: string; short_description: string; description: string;
  price: number; compare_at_price: number | null; stock: number; available_stock: number;
  volume: string; ingredients: string; usage_tips: string; precautions: string;
  is_published: boolean; is_archived: boolean;
  images: { id: number; image: string; alt: string }[];
  variants: { id: number; name: string; sku: string; price: number | null; stock: number; is_active: boolean }[];
}

const EMPTY: Record<string, string | boolean> = {
  category: "", name: "", sku: "", short_description: "", description: "",
  price: "", compare_at_price: "", stock: "0", volume: "",
  ingredients: "", usage_tips: "", precautions: "", is_published: false,
};

export function AdminProducts() {
  useDocumentTitle("Produits");
  const [sp, setSp] = useSearchParams();
  const [search, setSearch] = useDebounced(sp.get("search") ?? "");
  const page = Number(sp.get("page") ?? 1);
  const { data, loading, error, reload } = useApi<Paginated<AdminProduct>>(
    `/admin/products/?page=${page}&page_size=15${sp.get("search") ? `&search=${encodeURIComponent(sp.get("search")!)}` : ""}`,
  );
  const cats    = useApi<Category[]>("/admin/categories/");
  const [editing, setEditing] = useState<AdminProduct | "new" | null>(null);

  const remove = async (p: AdminProduct) => {
    if (!window.confirm(`Supprimer « ${p.name} » ? S'il figure dans des commandes, il sera archivé.`)) return;
    try { await del(`/admin/products/${p.id}/`); toast.success("Produit supprimé ou archivé."); reload(); }
    catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <PageTitle>Produits</PageTitle>
        <Button onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" aria-hidden />
          Nouveau produit
        </Button>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); const n = new URLSearchParams(); if (search) n.set("search", search); setSp(n); }}
        className="mb-5 max-w-sm" role="search"
      >
        <TextField label="Rechercher par nom ou référence" value={search} onChange={(e) => setSearch(e.target.value)} />
      </form>

      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> :
        data && data.results.length ? (
          <>
            <AdminTable head={["Produit", "Catégorie", "Prix", "Stock", "État", ""]}>
              {data.results.map((p) => (
                <tr key={p.id} className="group transition-colors hover:bg-white/4">
                  <td>
                    <p className="font-semibold text-white">{p.name}</p>
                    <p className="text-xs text-white/40">{p.sku}</p>
                  </td>
                  <td className="text-white/60">{p.category_name}</td>
                  <td className="font-semibold text-champagne">{formatPrice(p.price)}</td>
                  <td className={p.available_stock <= 0 ? "font-semibold text-red-400" : "text-white/70"}>
                    {p.available_stock}
                  </td>
                  <td>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      p.is_archived ? "bg-white/8 text-white/40" :
                      p.is_published ? "bg-emerald-500/15 text-emerald-400" :
                      "bg-yellow-500/15 text-yellow-400"
                    }`}>
                      {p.is_archived ? "Archivé" : p.is_published ? "Publié" : "Brouillon"}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => setEditing(p)}
                        aria-label={`Modifier ${p.name}`}
                        className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/8 hover:text-white"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                      </button>
                      <button
                        onClick={() => remove(p)}
                        aria-label={`Supprimer ${p.name}`}
                        className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-red-500/15 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </AdminTable>
            <Pagination
              page={page} count={data.count} pageSize={15}
              onChange={(p) => { const n = new URLSearchParams(sp); n.set("page", String(p)); setSp(n); }}
            />
          </>
        ) : (
          <EmptyState
            title="Aucun produit"
            text="Créez votre premier produit."
            action={<Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" />Nouveau produit</Button>}
          />
        )}

      {editing && (
        <ProductForm
          product={editing === "new" ? null : editing}
          categories={cats.data ?? []}
          onClose={() => { setEditing(null); reload(); }}
        />
      )}
    </>
  );
}

function ProductForm({ product, categories, onClose }: {
  product: AdminProduct | null; categories: Category[]; onClose: () => void
}) {
  const [current, setCurrent] = useState<AdminProduct | null>(product);
  const [f, setF] = useState<Record<string, string | boolean>>(
    product ? {
      category: String(product.category), name: product.name, sku: product.sku,
      short_description: product.short_description, description: product.description,
      price: String(product.price),
      compare_at_price: product.compare_at_price ? String(product.compare_at_price) : "",
      stock: String(product.stock), volume: product.volume,
      ingredients: product.ingredients, usage_tips: product.usage_tips,
      precautions: product.precautions, is_published: product.is_published,
    } : EMPTY,
  );
  const [err, setErr] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: string) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const txt = (k: string, label: string, extra: object = {}) => (
    <TextField label={label} value={String(f[k])} onChange={set(k)} error={err?.field(k)} {...extra} />
  );

  const save = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    const body = {
      ...f,
      category: Number(f.category), price: Number(f.price), stock: Number(f.stock),
      compare_at_price: f.compare_at_price ? Number(f.compare_at_price) : null,
    };
    try {
      const saved = current
        ? await patch<AdminProduct>(`/admin/products/${current.id}/`, body)
        : await post<AdminProduct>("/admin/products/", body);
      setCurrent(saved);
      toast.success("Produit enregistré.");
    } catch (er) {
      if (er instanceof ApiError) setErr(er);
      toast.error(errorMessage(er));
    } finally { setBusy(false); }
  };

  const reloadCurrent = async () => {
    if (!current) return;
    setCurrent(await get<AdminProduct>(`/admin/products/${current.id}/`));
  };

  const upload = async (file: File | undefined) => {
    if (!file || !current) return;
    const fd = new FormData(); fd.append("image", file); fd.append("alt", String(f.name));
    try { await post(`/admin/products/${current.id}/images/`, fd); toast.success("Photo ajoutée."); await reloadCurrent(); }
    catch (e) { toast.error(errorMessage(e)); }
  };

  const removeImage = async (id: number) => {
    try { await del(`/admin/products/${current!.id}/images/${id}/`); await reloadCurrent(); }
    catch (e) { toast.error(errorMessage(e)); }
  };

  const [v, setV] = useState({ name: "", sku: "", price: "", stock: "0" });

  const addVariant = async () => {
    try {
      await post("/admin/variants/", {
        product: current!.id, name: v.name, sku: v.sku,
        price: v.price ? Number(v.price) : null, stock: Number(v.stock),
      });
      setV({ name: "", sku: "", price: "", stock: "0" });
      await reloadCurrent();
    } catch (e) {
      toast.error(e instanceof ApiError ? Object.values(e.errors).flat().join(" ") || e.message : errorMessage(e));
    }
  };

  const removeVariant = async (id: number) => {
    try { await del(`/admin/variants/${id}/`); await reloadCurrent(); }
    catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <Modal open onClose={onClose} title={current ? "Modifier le produit" : "Nouveau produit"}>
      <form onSubmit={save} className="space-y-4" noValidate>
        <SelectField label="Catégorie" required value={String(f.category)} onChange={set("category")} error={err?.field("category")}>
          <option value="">Choisir une catégorie</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </SelectField>
        {txt("name", "Nom du produit", { required: true })}
        {txt("sku", "Référence SKU", { required: true })}
        <div className="grid grid-cols-2 gap-3">
          {txt("price", "Prix (FCFA)", { type: "number", min: 0, required: true })}
          {txt("compare_at_price", "Ancien prix (promo)", { type: "number", min: 0 })}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {txt("stock", "Stock (sans variantes)", { type: "number", min: 0 })}
          {txt("volume", "Contenance / format")}
        </div>
        {txt("short_description", "Description courte")}
        <TextArea label="Description" value={String(f.description)} onChange={set("description")} />
        <TextArea label="Composition (fournie par la marque)" value={String(f.ingredients)} onChange={set("ingredients")} />
        <TextArea label="Conseils d'utilisation validés" value={String(f.usage_tips)} onChange={set("usage_tips")} />
        <TextArea label="Précautions" value={String(f.precautions)} onChange={set("precautions")} />
        <CheckField
          label="Publié sur le site"
          checked={!!f.is_published}
          onChange={(e) => setF({ ...f, is_published: e.target.checked })}
        />
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Enregistrement…" : "Enregistrer le produit"}
        </Button>
      </form>

      {current ? (
        <div className="mt-8 space-y-8 border-t border-line pt-6">
          {/* Photos */}
          <section aria-labelledby="photos-label">
            <h3 id="photos-label" className="mb-3 font-display text-lg font-bold">Photos</h3>
            {current.images.length > 0 && (
              <ul className="mb-3 flex flex-wrap gap-2">
                {current.images.map((im) => (
                  <li key={im.id} className="relative">
                    <img src={im.image} alt={im.alt} className="h-20 w-20 rounded-xl object-cover" />
                    <button
                      onClick={() => removeImage(im.id)}
                      aria-label="Supprimer la photo"
                      className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md"
                    >
                      <Trash2 className="h-3 w-3 text-danger" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <label className="btn btn-secondary cursor-pointer">
              <ImagePlus className="h-4 w-4" aria-hidden />
              Ajouter une photo
              <input
                type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }}
              />
            </label>
            <p className="mt-1.5 text-xs text-muted">JPEG, PNG ou WEBP, 5 Mo maximum.</p>
          </section>

          {/* Variantes */}
          <section aria-labelledby="variants-label">
            <h3 id="variants-label" className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
              <Warehouse className="h-5 w-5" aria-hidden />
              Variantes et stock
            </h3>
            {current.variants.length > 0 && (
              <ul className="mb-4 divide-y divide-line text-sm">
                {current.variants.map((x) => (
                  <li key={x.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="text-ink">
                      {x.name} <span className="text-muted">({x.sku})</span> ·{" "}
                      {x.price ? formatPrice(x.price) : "prix du produit"} ·{" "}
                      stock <strong>{x.stock}</strong>
                    </span>
                    <button
                      onClick={() => removeVariant(x.id)}
                      aria-label={`Supprimer la variante ${x.name}`}
                      className="rounded-lg p-1.5 text-muted hover:bg-danger/8 hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Nom" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
              <TextField label="SKU" value={v.sku} onChange={(e) => setV({ ...v, sku: e.target.value })} />
              <TextField label="Prix (facultatif)" type="number" value={v.price} onChange={(e) => setV({ ...v, price: e.target.value })} />
              <TextField label="Stock" type="number" min={0} value={v.stock} onChange={(e) => setV({ ...v, stock: e.target.value })} />
            </div>
            <Button variant="secondary" className="mt-3" onClick={addVariant} disabled={!v.name || !v.sku}>
              Ajouter la variante
            </Button>
          </section>
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted">Enregistrez le produit pour ajouter des photos et des variantes.</p>
      )}
    </Modal>
  );
}

/* ─── ORDERS ─────────────────────────────────────────────────── */
const STATUSES: [string, string][] = [
  ["pending",   "En attente"],
  ["confirmed", "Confirmée"],
  ["preparing", "En préparation"],
  ["shipped",   "Expédiée"],
  ["delivered", "Livrée"],
  ["cancelled", "Annulée"],
];

const STATUS_COLOR: Record<string, string> = {
  pending:   "bg-yellow-500/15 text-yellow-400",
  confirmed: "bg-blue-500/15 text-blue-400",
  preparing: "bg-purple-500/15 text-purple-400",
  shipped:   "bg-indigo-500/15 text-indigo-400",
  delivered: "bg-emerald-500/15 text-emerald-400",
  cancelled: "bg-red-500/15 text-red-400",
};

export function AdminOrders() {
  useDocumentTitle("Commandes");
  const [sp, setSp] = useSearchParams();
  const [search, setSearch] = useState(sp.get("search") ?? "");
  const page = Number(sp.get("page") ?? 1);
  const qs = new URLSearchParams({ page: String(page), page_size: "15" });
  for (const k of ["search", "status"]) if (sp.get(k)) qs.set(k, sp.get(k)!);
  const { data, loading, error, reload } = useApi<Paginated<OrderListItem>>(`/admin/orders/?${qs}`);
  const [open, setOpen] = useState<string | null>(null);

  const upd = (k: string, v: string) => {
    const n = new URLSearchParams(sp);
    if (v) n.set(k, v); else n.delete(k);
    n.delete("page");
    setSp(n);
  };

  return (
    <>
      <PageTitle>Commandes</PageTitle>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <form role="search" onSubmit={(e) => { e.preventDefault(); upd("search", search); }}>
          <TextField label="Rechercher par référence, nom ou téléphone" value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>
        <SelectField label="Statut" value={sp.get("status") ?? ""} onChange={(e) => upd("status", e.target.value)}>
          <option value="">Tous les statuts</option>
          {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </SelectField>
      </div>

      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> :
        data && data.results.length ? (
          <>
            <AdminTable head={["Référence", "Client", "Date", "Total", "Statut", "Paiement"]}>
              {data.results.map((o) => (
                <tr key={o.number} className="cursor-pointer transition-colors hover:bg-white/4" onClick={() => setOpen(o.number)}>
                  <td>
                    <button className="font-mono text-sm font-semibold text-plum-light hover:underline">
                      {o.number}
                    </button>
                  </td>
                  <td>
                    <p className="font-medium text-white">{o.first_name} {o.last_name}</p>
                    <p className="text-xs text-white/40">{o.phone}</p>
                  </td>
                  <td className="text-white/60">{formatDate(o.created_at)}</td>
                  <td className="font-semibold text-champagne">{formatPrice(o.total)}</td>
                  <td>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[o.status] ?? "bg-white/8 text-white/60"}`}>
                      {o.status_label}
                    </span>
                  </td>
                  <td className="text-white/60">{o.payment_status_label}</td>
                </tr>
              ))}
            </AdminTable>
            <Pagination
              page={page} count={data.count} pageSize={15}
              onChange={(p) => { const n = new URLSearchParams(sp); n.set("page", String(p)); setSp(n); }}
            />
          </>
        ) : (
          <EmptyState title="Aucune commande" text="Les commandes apparaîtront ici." />
        )}

      {open && <OrderModal number={open} onClose={() => { setOpen(null); reload(); }} />}
    </>
  );
}

function OrderModal({ number, onClose }: { number: string; onClose: () => void }) {
  const { data: o, loading, error, reload } = useApi<Order>(`/admin/orders/${number}/`);
  const [tracking, setTracking] = useState<string | null>(null);
  const [fee,  setFee]  = useState("");
  const [note, setNote] = useState("");

  const send = async (body: object, msg: string) => {
    try { await patch(`/admin/orders/${number}/update/`, body); toast.success(msg); reload(); }
    catch (e) { toast.error(errorMessage(e)); }
  };
  const label = (s: string) => STATUSES.find(([v]) => v === s)![1];

  return (
    <Modal open onClose={onClose} title={`Commande ${number}`}>
      {loading ? <Spinner /> : error || !o ? <ErrorState message={error ?? "Erreur"} onRetry={reload} /> : (
        <div className="space-y-5 text-sm">
          {/* Client */}
          <div className="rounded-xl bg-blush/60 p-4">
            <p className="font-semibold text-ink">{o.first_name} {o.last_name}</p>
            <p className="text-muted">{o.phone}{o.email ? ` · ${o.email}` : ""}</p>
            <p className="mt-1 text-muted">{o.address_line}, {o.city} ({o.delivery_zone_name})</p>
          </div>

          {o.customer_note && (
            <div className="rounded-xl border border-champagne/30 bg-champagne/8 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-champagne">Note client</p>
              <p className="mt-1 text-ink">{o.customer_note}</p>
            </div>
          )}

          {/* Articles */}
          <ul className="divide-y divide-line">
            {o.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3 py-2">
                <span>{i.product_name}{i.variant_name ? ` (${i.variant_name})` : ""} ×{i.quantity}</span>
                <span className="shrink-0 font-semibold">{formatPrice(i.line_total)}</span>
              </li>
            ))}
          </ul>

          {/* Totaux */}
          <div className="space-y-1.5 rounded-xl bg-blush/40 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Sous-total</span>
              <span>{formatPrice(o.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Livraison</span>
              <span>{o.delivery_fee_pending ? "À confirmer" : formatPrice(o.delivery_fee)}</span>
            </div>
            <div className="flex justify-between border-t border-line pt-1.5 font-bold">
              <span>Total</span>
              <span className="text-plum">{formatPrice(o.total)}</span>
            </div>
          </div>

          {/* Frais à confirmer */}
          {o.delivery_fee_pending && (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <TextField label="Frais de livraison confirmés (FCFA)" type="number" min={0} value={fee} onChange={(e) => setFee(e.target.value)} />
              </div>
              <Button variant="secondary" disabled={!fee} onClick={() => send({ delivery_fee: Number(fee) }, "Frais enregistrés.")}>
                Valider
              </Button>
            </div>
          )}

          {/* Changement de statut — utilise allowed_transitions de l'API */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <p className="font-semibold text-ink">Statut :</p>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[o.status] ?? ""}`}>
                {o.status_label}
              </span>
            </div>
            <TextField label="Note de changement (facultatif)" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="mt-2 flex flex-wrap gap-2">
              {o.allowed_transitions.map((s) => (
                <Button
                  key={s}
                  variant={s === "cancelled" ? "danger" : "primary"}
                  onClick={() => {
                    if (s === "cancelled" && !window.confirm("Annuler la commande ? Le stock sera restitué.")) return;
                    send({ status: s, note }, `Statut : ${label(s)}`);
                    setNote("");
                  }}
                >
                  {label(s)}
                </Button>
              ))}
            </div>
          </div>

          {/* Paiement */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-ink">Paiement : {o.payment_status_label}</span>
            {o.payment_status !== "paid" && o.status !== "cancelled" && (
              <Button
                variant="secondary"
                onClick={() => { if (window.confirm("Confirmer que le paiement a bien été reçu ?")) send({ payment_status: "paid" }, "Commande marquée payée."); }}
              >
                Marquer comme payée
              </Button>
            )}
          </div>

          {/* Suivi */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <TextField
                label="Informations de suivi"
                value={tracking ?? o.tracking_info}
                onChange={(e) => setTracking(e.target.value)}
              />
            </div>
            <Button variant="secondary" onClick={() => send({ tracking_info: tracking ?? o.tracking_info }, "Suivi enregistré.")}>
              Enregistrer
            </Button>
          </div>

          {/* Historique */}
          <div>
            <p className="mb-3 font-semibold text-ink">Historique</p>
            <ol className="relative space-y-3 border-l-2 border-line pl-5">
              {o.history.map((h, i) => (
                <li key={i} className="relative">
                  <div className="absolute -left-[1.4375rem] top-1 h-2.5 w-2.5 rounded-full border-2 border-plum bg-white" />
                  <p className="font-medium text-ink">{h.status_label}</p>
                  <p className="text-xs text-muted">{formatDate(h.created_at)}{h.note ? ` · ${h.note}` : ""}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ─── CUSTOMERS ──────────────────────────────────────────────── */
export function AdminCustomers() {
  useDocumentTitle("Clients");
  const [search, setSearch] = useState("");
  const [q, setQ]           = useState("");
  const [page, setPage]     = useState(1);
  const { data, loading, error, reload } = useApi<Paginated<{
    id: number; email: string; first_name: string; last_name: string;
    phone: string; date_joined: string; orders_count: number;
  }>>(`/admin/customers/?page=${page}&page_size=15${q ? `&search=${encodeURIComponent(q)}` : ""}`);

  return (
    <>
      <PageTitle>Clients</PageTitle>
      <form
        role="search" className="mb-5 max-w-sm"
        onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(search); }}
      >
        <TextField label="Rechercher par nom ou e-mail" value={search} onChange={(e) => setSearch(e.target.value)} />
      </form>

      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> :
        data && data.results.length ? (
          <>
            <AdminTable head={["Nom", "E-mail", "Téléphone", "Inscription", "Commandes"]}>
              {data.results.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-white/4">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-plum/20 text-xs font-bold text-plum-light">
                        {c.first_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-white">{c.first_name} {c.last_name}</span>
                    </div>
                  </td>
                  <td className="text-white/60">{c.email}</td>
                  <td className="text-white/60">{c.phone}</td>
                  <td className="text-white/60">{formatDate(c.date_joined)}</td>
                  <td>
                    <span className="inline-flex rounded-full bg-plum/20 px-2.5 py-0.5 text-xs font-semibold text-plum-light">
                      {c.orders_count}
                    </span>
                  </td>
                </tr>
              ))}
            </AdminTable>
            <Pagination page={page} count={data.count} pageSize={15} onChange={setPage} />
          </>
        ) : <EmptyState title="Aucun client" />}
    </>
  );
}

/* ─── REVIEWS & MESSAGES ─────────────────────────────────────── */
export function AdminReviewsMessages() {
  useDocumentTitle("Avis et messages");
  const reviews = useApi<Paginated<{
    id: number; product_name: string; user_email: string;
    rating: number; comment: string; is_approved: boolean;
  }>>("/admin/reviews/");
  const msgs = useApi<Paginated<{
    id: number; name: string; email: string; subject: string;
    message: string; is_read: boolean; created_at: string;
  }>>("/admin/messages/");

  const approve = async (id: number, v: boolean) => {
    try { await patch(`/admin/reviews/${id}/`, { is_approved: v }); reviews.reload(); }
    catch (e) { toast.error(errorMessage(e)); }
  };
  const markRead = async (id: number) => {
    try { await patch(`/admin/messages/${id}/`, { is_read: true }); msgs.reload(); }
    catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <>
      <PageTitle>Avis et messages</PageTitle>

      {/* Avis */}
      <h2 className="mb-4 font-display text-lg font-bold text-white">Avis clients</h2>
      {reviews.loading ? <Spinner /> : reviews.data?.results.length ? (
        <ul className="space-y-3">
          {reviews.data.results.map((r) => (
            <li key={r.id} className="rounded-2xl border border-white/8 bg-white/4 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{r.product_name}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-champagne text-champagne" : "text-white/20"}`} aria-hidden />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-white/60">{r.comment}</p>
                  <p className="text-xs text-white/30">{r.user_email}</p>
                </div>
                <Button
                  variant={r.is_approved ? "ghost" : "primary"}
                  onClick={() => approve(r.id, !r.is_approved)}
                >
                  {r.is_approved ? "Retirer" : "Publier"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="rounded-xl bg-white/4 px-4 py-3 text-sm text-white/40">Aucun avis pour le moment.</p>}

      {/* Messages */}
      <h2 className="mb-4 mt-10 font-display text-lg font-bold text-white">Messages de contact</h2>
      {msgs.loading ? <Spinner /> : msgs.data?.results.length ? (
        <ul className="space-y-3">
          {msgs.data.results.map((m) => (
            <li key={m.id} className={`rounded-2xl border p-4 ${m.is_read ? "border-white/8 bg-white/4" : "border-plum/30 bg-plum/8"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-white">{m.subject}</p>
                    {!m.is_read && (
                      <span className="inline-flex rounded-full bg-plum px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ivory">
                        Nouveau
                      </span>
                    )}
                    <span className="text-xs text-white/30 ml-auto">{formatDate(m.created_at)}</span>
                  </div>
                  <p className="whitespace-pre-line text-sm text-white/60">{m.message}</p>
                  <p className="text-xs text-white/40">{m.name} · {m.email}</p>
                </div>
              </div>
              {!m.is_read && (
                <Button variant="ghost" className="mt-3" onClick={() => markRead(m.id)}>
                  Marquer comme lu
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : <p className="rounded-xl bg-white/4 px-4 py-3 text-sm text-white/40">Aucun message.</p>}
    </>
  );
}

/* ─── SETTINGS ───────────────────────────────────────────────── */
export function AdminSettings() {
  useDocumentTitle("Paramètres");
  return (
    <>
      <PageTitle>Paramètres de la boutique</PageTitle>
      <div className="space-y-8">
        <StoreForm />
        <Zones />
        <Categories />
        <Banners />
        <NewsletterSection />
      </div>
    </>
  );
}

function StoreForm() {
  const { data, loading, error, reload } = useApi<StoreSettings & { low_stock_threshold: number }>("/admin/settings/");
  const [f, setF] = useState<Record<string, string | boolean> | null>(null);
  const [err, setErr] = useState<ApiError | null>(null);

  useEffect(() => {
    if (!data) return;
    setF(
      Object.fromEntries(
        Object.entries(data).filter(([k]) => k !== "logo").map(([k, v]) => [k, v ?? ""]),
      ) as Record<string, string | boolean>,
    );
  }, [data]);

  if (loading) return <Spinner />;
  if (error || !data) return <ErrorState message={error ?? "Erreur"} onRetry={reload} />;
  if (!f) return <Spinner />;

  const set = (k: string) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const t   = (k: string, label: string, extra: object = {}) => (
    <TextField label={label} value={String(f[k] ?? "")} onChange={set(k)} error={err?.field(k)} {...extra} />
  );

  const save = async (e: FormEvent) => {
    e.preventDefault(); setErr(null);
    try {
      await patch("/admin/settings/", { ...f, low_stock_threshold: Number(f.low_stock_threshold) });
      toast.success("Paramètres enregistrés.");
      reload();
    } catch (er) { if (er instanceof ApiError) setErr(er); toast.error(errorMessage(er)); }
  };

  const uploadLogo = async (file?: File) => {
    if (!file) return;
    const fd = new FormData(); fd.append("logo", file);
    try { await patch("/admin/settings/", fd); toast.success("Logo mis à jour."); reload(); }
    catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <form onSubmit={save} className="rounded-2xl border border-white/8 bg-white/4 p-6 space-y-5" noValidate>
      <h2 className="font-display text-lg font-bold text-white">Boutique</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {t("name", "Nom de la boutique")}
        {t("tagline", "Slogan")}
        {t("contact_email", "E-mail de contact", { type: "email" })}
        {t("contact_phone", "Téléphone")}
        {t("address", "Adresse")}
        {t("whatsapp_number", "Numéro WhatsApp", { hint: "Format international, chiffres uniquement (ex. 221770000000)." })}
        {t("instagram_url", "Instagram (URL)")}
        {t("facebook_url", "Facebook (URL)")}
        {t("tiktok_url", "TikTok (URL)")}
        {t("low_stock_threshold", "Seuil de stock faible", { type: "number", min: 0 })}
      </div>
      {t("announcement_text", "Bandeau d'annonce")}
      <TextArea label="Texte du footer" rows={3} value={String(f.footer_text ?? "")} onChange={set("footer_text")} />
      <TextArea label="Procédure si zone non configurée" rows={3} value={String(f.unknown_zone_policy ?? "")} onChange={set("unknown_zone_policy")} />
      <CheckField label="Afficher le bandeau d'annonce" checked={!!f.announcement_active} onChange={(e) => setF({ ...f, announcement_active: e.target.checked })} />
      <CheckField label="Autoriser la commande sans compte" checked={!!f.guest_checkout_enabled} onChange={(e) => setF({ ...f, guest_checkout_enabled: e.target.checked })} />
      <CheckField label="Proposer le paiement à la livraison" checked={!!f.payment_cash_on_delivery} onChange={(e) => setF({ ...f, payment_cash_on_delivery: e.target.checked })} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit">Enregistrer les paramètres</Button>
        <label className="btn btn-secondary cursor-pointer">
          <ImagePlus className="h-4 w-4" aria-hidden />
          Changer le logo
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => uploadLogo(e.target.files?.[0])} />
        </label>
      </div>
    </form>
  );
}

function Zones() {
  const { data, loading, error, reload } = useApi<(DeliveryZone & { is_active: boolean })[]>("/admin/delivery-zones/");
  const [z, setZ] = useState({ name: "", fee: "", info: "" });

  const add = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await post("/admin/delivery-zones/", { name: z.name, fee: Number(z.fee), info: z.info });
      setZ({ name: "", fee: "", info: "" });
      reload();
    } catch (er) { toast.error(er instanceof ApiError ? Object.values(er.errors).flat().join(" ") || er.message : errorMessage(er)); }
  };
  const toggle = async (id: number, v: boolean) => {
    try { await patch(`/admin/delivery-zones/${id}/`, { is_active: v }); reload(); }
    catch (e) { toast.error(errorMessage(e)); }
  };
  const setFee = async (id: number, fee: string) => {
    try { await patch(`/admin/delivery-zones/${id}/`, { fee: Number(fee) }); toast.success("Frais mis à jour."); reload(); }
    catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <section className="rounded-2xl border border-white/8 bg-white/4 p-6" aria-labelledby="zones-label">
      <h2 id="zones-label" className="mb-5 font-display text-lg font-bold text-white">Zones et frais de livraison</h2>
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <ul className="mb-5 divide-y divide-white/6 text-sm">
          {data?.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span className={x.is_active ? "text-white" : "text-white/30 line-through"}>{x.name}</span>
              <span className="flex items-center gap-2">
                <label className="sr-only" htmlFor={`fee-${x.id}`}>Frais pour {x.name}</label>
                <input
                  id={`fee-${x.id}`}
                  className="input !w-28 !text-sm"
                  type="number" min={0}
                  defaultValue={x.fee}
                  onBlur={(e) => Number(e.target.value) !== x.fee && setFee(x.id, e.target.value)}
                />
                <span className="text-white/40">FCFA</span>
                <Button variant="ghost" onClick={() => toggle(x.id, !x.is_active)}>
                  {x.is_active ? "Désactiver" : "Activer"}
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} className="grid gap-3 sm:grid-cols-4">
        <TextField label="Zone" required value={z.name} onChange={(e) => setZ({ ...z, name: e.target.value })} />
        <TextField label="Frais (FCFA)" type="number" min={0} required value={z.fee} onChange={(e) => setZ({ ...z, fee: e.target.value })} />
        <TextField label="Informations" value={z.info} onChange={(e) => setZ({ ...z, info: e.target.value })} />
        <div className="flex items-end">
          <Button type="submit" className="w-full">Ajouter</Button>
        </div>
      </form>
    </section>
  );
}

function Categories() {
  const { data, loading, error, reload } = useApi<(Category & { is_active: boolean })[]>("/admin/categories/");
  const [c, setC] = useState({ name: "", description: "" });

  const add = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await post("/admin/categories/", c);
      setC({ name: "", description: "" });
      toast.success("Catégorie ajoutée.");
      reload();
    } catch (er) { toast.error(er instanceof ApiError ? Object.values(er.errors).flat().join(" ") || er.message : errorMessage(er)); }
  };
  const toggle = async (id: number, v: boolean) => {
    try { await patch(`/admin/categories/${id}/`, { is_active: v }); reload(); }
    catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <section className="rounded-2xl border border-white/8 bg-white/4 p-6" aria-labelledby="cats-label">
      <h2 id="cats-label" className="mb-5 font-display text-lg font-bold text-white">Catégories</h2>
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <ul className="mb-5 divide-y divide-white/6 text-sm">
          {data?.map((x) => (
            <li key={x.id} className="flex items-center justify-between py-3">
              <span className={x.is_active ? "text-white" : "text-white/30 line-through"}>{x.name}</span>
              <Button variant="ghost" onClick={() => toggle(x.id, !x.is_active)}>
                {x.is_active ? "Désactiver" : "Activer"}
              </Button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} className="grid gap-3 sm:grid-cols-3">
        <TextField label="Nouvelle catégorie" required value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} />
        <TextField label="Description" value={c.description} onChange={(e) => setC({ ...c, description: e.target.value })} />
        <div className="flex items-end">
          <Button type="submit" className="w-full">Ajouter</Button>
        </div>
      </form>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-white/30">
        <TriangleAlert className="h-3.5 w-3.5" aria-hidden />
        Une catégorie contenant des produits ne peut pas être supprimée, seulement désactivée.
      </p>
    </section>
  );
}

/* ─── BANNIÈRES ──────────────────────────────────────────────── */
const EMPTY_BANNER: Record<string, string | boolean> = {
  banner_type: "hero", title: "", subtitle: "",
  button_text: "Découvrir la boutique", link_url: "",
  position: "0", is_active: true,
};

function Banners() {
  const { data, loading, error, reload } = useApi<AdminBanner[]>("/admin/banners/");
  const [editing, setEditing] = useState<(AdminBanner & { _file?: File }) | "new" | null>(null);
  const [err, setErr]         = useState<ApiError | null>(null);
  const [busy, setBusy]       = useState(false);
  const [f, setF]             = useState<Record<string, string | boolean>>(EMPTY_BANNER);

  const openNew  = () => { setF(EMPTY_BANNER); setErr(null); setEditing("new"); };
  const openEdit = (b: AdminBanner) => {
    setF({
      banner_type: b.banner_type, title: b.title, subtitle: b.subtitle,
      button_text: b.button_text, link_url: b.link_url,
      position: String(b.position), is_active: b.is_active,
    });
    setF({
      banner_type: b.banner_type, title: b.title, subtitle: b.subtitle,
      button_text: b.button_text, link_url: b.link_url,
      position: String(b.position), is_active: b.is_active,
    });
    setErr(null);
    setEditing(b);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const fd = new FormData();
      Object.entries(f).forEach(([k, v]) => fd.append(k, String(v)));
      if (editing !== "new" && (editing as AdminBanner & { _file?: File })._file) {
        fd.append("image_upload", (editing as AdminBanner & { _file?: File })._file!);
      }
      if (editing === "new") {
        await post("/admin/banners/", fd);
        toast.success("Bannière créée.");
      } else {
        await patch(`/admin/banners/${(editing as AdminBanner).id}/`, fd);
        toast.success("Bannière mise à jour.");
      }
      setEditing(null);
      reload();
    } catch (er) {
      if (er instanceof ApiError) setErr(er);
      toast.error(errorMessage(er));
    } finally { setBusy(false); }
  };

  const remove = async (id: number) => {
    if (!window.confirm("Supprimer cette bannière ?")) return;
    try { await del(`/admin/banners/${id}/`); reload(); }
    catch (e) { toast.error(errorMessage(e)); }
  };

  const set = (k: string) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  return (
    <section className="rounded-2xl border border-white/8 bg-white/4 p-6" aria-labelledby="banners-label">
      <div className="mb-5 flex items-center justify-between">
        <h2 id="banners-label" className="font-display text-lg font-bold text-white">Bannières</h2>
        <Button onClick={openNew}><Plus className="h-4 w-4" />Nouvelle bannière</Button>
      </div>
      <p className="mb-4 text-xs text-white/40">
        Les bannières de type <strong className="text-white/70">hero</strong> apparaissent en haut de la page d'accueil.
        Les bannières <strong className="text-white/70">promo</strong> forment le carrousel promotionnel.
      </p>

      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> :
        data && data.length > 0 ? (
          <ul className="divide-y divide-white/6 text-sm">
            {data.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  {b.image && (
                    <img src={b.image} alt="" className="h-10 w-14 rounded-lg object-cover opacity-80" />
                  )}
                  <div>
                    <span className={b.is_active ? "text-white" : "text-white/30 line-through"}>
                      {b.title}
                    </span>
                    <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/50">
                      {b.banner_type}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(b)} aria-label={`Modifier ${b.title}`}
                    className="rounded-lg p-1.5 text-white/40 hover:bg-white/8 hover:text-white">
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <button onClick={() => remove(b.id)} aria-label={`Supprimer ${b.title}`}
                    className="rounded-lg p-1.5 text-white/40 hover:bg-red-500/15 hover:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl bg-white/4 px-4 py-3 text-sm text-white/40">
            Aucune bannière. Créez-en une pour personnaliser la page d'accueil.
          </p>
        )}

      {editing && (
        <Modal open onClose={() => setEditing(null)} title={editing === "new" ? "Nouvelle bannière" : "Modifier la bannière"}>
          <form onSubmit={save} className="space-y-4" noValidate>
            <SelectField label="Type" value={String(f.banner_type)} onChange={set("banner_type")} error={err?.field("banner_type")}>
              <option value="hero">Hero (bandeau principal)</option>
              <option value="promo">Promotionnel (carrousel)</option>
            </SelectField>
            <TextField label="Titre" required value={String(f.title)} onChange={set("title")} error={err?.field("title")} />
            <TextField label="Sous-titre (facultatif)" value={String(f.subtitle)} onChange={set("subtitle")} />
            <TextField label="Texte du bouton" value={String(f.button_text)} onChange={set("button_text")} hint='Ex : "Découvrir la boutique"' />
            <TextField label="Lien (chemin relatif)" value={String(f.link_url)} onChange={set("link_url")} hint='Ex : /boutique ou /promotions. Vide = /boutique.' />
            <TextField label="Ordre d'affichage" type="number" min={0} value={String(f.position)} onChange={set("position")} />
            <CheckField label="Bannière active (visible sur le site)" checked={!!f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} />
            <div>
              <p className="mb-1.5 text-sm font-semibold text-ink">Image</p>
              {editing !== "new" && (editing as AdminBanner).image && (
                <img src={(editing as AdminBanner).image!} alt="" className="mb-2 h-24 w-full rounded-xl object-cover" />
              )}
              <label className="btn btn-secondary cursor-pointer">
                <ImagePlus className="h-4 w-4" aria-hidden />
                {editing !== "new" && (editing as AdminBanner).image ? "Changer l'image" : "Ajouter une image"}
                <input
                  type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                  onChange={(e) => {
                    if (e.target.files?.[0] && editing !== "new") {
                setEditing({ ...(editing as AdminBanner), _file: e.target.files[0] });
                    }
                  }}
                />
              </label>
              <p className="mt-1 text-xs text-muted">JPEG, PNG ou WEBP, 5 Mo maximum.</p>
            </div>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Enregistrement…" : "Enregistrer la bannière"}
            </Button>
          </form>
        </Modal>
      )}
    </section>
  );
}

/* ─── NEWSLETTER ─────────────────────────────────────────────── */
function NewsletterSection() {
  const { data, loading, error, reload } = useApi<Paginated<{
    id: number; email: string; is_active: boolean; subscribed_at: string;
  }>>("/admin/newsletter/");

  const toggle = async (id: number, active: boolean) => {
    try { await patch(`/admin/newsletter/${id}/`, { is_active: active }); reload(); }
    catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <section className="rounded-2xl border border-white/8 bg-white/4 p-6" aria-labelledby="newsletter-label">
      <div className="mb-5 flex items-center justify-between">
        <h2 id="newsletter-label" className="font-display text-lg font-bold text-white">
          Abonnés newsletter
        </h2>
        {data && (
          <span className="rounded-full bg-plum/20 px-3 py-1 text-xs font-semibold text-plum-light">
            {data.count} abonné{data.count > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> :
        data && data.results.length > 0 ? (
          <ul className="divide-y divide-white/6 text-sm">
            {data.results.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <span className={s.is_active ? "text-white" : "text-white/30 line-through"}>
                    {s.email}
                  </span>
                  <p className="text-xs text-white/30">{formatDate(s.subscribed_at)}</p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => toggle(s.id, !s.is_active)}
                >
                  {s.is_active ? "Désactiver" : "Réactiver"}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl bg-white/4 px-4 py-3 text-sm text-white/40">
            Aucun abonné pour le moment.
          </p>
        )}
    </section>
  );
}
