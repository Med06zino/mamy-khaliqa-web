import { ImagePlus, Pencil, Plus, Trash2, TriangleAlert, Warehouse } from "lucide-react";
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
import type { Category, Dashboard as Dash, DeliveryZone, Order, OrderListItem, Paginated, StoreSettings } from "../../types";

const Title = ({ children }: { children: ReactNode }) => <h1 className="mb-6 text-3xl">{children}</h1>;
function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="border-b border-line bg-blush"><tr>{head.map((h) => <th key={h} scope="col" className="p-3 font-medium">{h}</th>)}</tr></thead>
        <tbody className="[&_td]:p-3 [&_tr]:border-b [&_tr]:border-line [&_tr:last-child]:border-0">{children}</tbody>
      </table>
    </div>
  );
}
const useDebounced = (initial = "") => { const [v, setV] = useState(initial); return [v, setV] as const; };

/* ---------------- Dashboard ---------------- */
export function AdminDashboard() {
  useDocumentTitle("Tableau de bord");
  const { data: d, loading, error, reload } = useApi<Dash>("/admin/dashboard/");
  if (loading) return <Spinner />;
  if (error || !d) return <ErrorState message={error ?? "Erreur"} onRetry={reload} />;
  const stats: [string, string | number][] = [
    ["Commandes au total", d.orders_total], ["Commandes en attente", d.orders_pending], ["Commandes en cours", d.orders_in_progress],
    ["Commandes livrées", d.orders_delivered], ["Chiffre d'affaires encaissé", formatPrice(d.revenue_collected)], ["Produits actifs", d.products_active],
    ["Produits en rupture", d.products_out_of_stock], ["Produits en stock faible", d.products_low_stock],
  ];
  return (
    <>
      <Title>Tableau de bord</Title>
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([k, v]) => <div key={k} className="card p-5"><dt className="text-sm text-muted">{k}</dt><dd className="mt-1 font-display text-3xl text-plum">{v}</dd></div>)}
      </dl>
      <h2 className="mb-3 mt-10 text-2xl">Produits les plus vendus</h2>
      {d.top_products.length ? (
        <Table head={["Produit", "Quantité vendue"]}>{d.top_products.map((t) => <tr key={t.product_name}><td>{t.product_name}</td><td>{t.sold}</td></tr>)}</Table>
      ) : <p className="text-sm text-muted">Aucune vente enregistrée pour le moment.</p>}
      <p className="mt-6 text-xs text-muted">Le chiffre d'affaires ne compte que les commandes que vous avez marquées comme payées.</p>
    </>
  );
}

/* ---------------- Products ---------------- */
interface AdminProduct {
  id: number; category: number; category_name: string; name: string; slug: string; sku: string; short_description: string; description: string;
  price: number; compare_at_price: number | null; stock: number; available_stock: number; volume: string; ingredients: string; usage_tips: string;
  precautions: string; is_published: boolean; is_archived: boolean;
  images: { id: number; image: string; alt: string }[]; variants: { id: number; name: string; sku: string; price: number | null; stock: number; is_active: boolean }[];
}
const EMPTY: Record<string, string | boolean> = { category: "", name: "", sku: "", short_description: "", description: "", price: "", compare_at_price: "", stock: "0", volume: "", ingredients: "", usage_tips: "", precautions: "", is_published: false };

export function AdminProducts() {
  useDocumentTitle("Produits");
  const [sp, setSp] = useSearchParams();
  const [search, setSearch] = useDebounced(sp.get("search") ?? "");
  const page = Number(sp.get("page") ?? 1);
  const { data, loading, error, reload } = useApi<Paginated<AdminProduct>>(`/admin/products/?page=${page}&page_size=15${sp.get("search") ? `&search=${encodeURIComponent(sp.get("search")!)}` : ""}`);
  const cats = useApi<Category[]>("/admin/categories/");
  const [editing, setEditing] = useState<AdminProduct | "new" | null>(null);
  const remove = async (p: AdminProduct) => {
    if (!window.confirm(`Supprimer « ${p.name} » ? S'il figure dans des commandes, il sera archivé.`)) return;
    try { await del(`/admin/products/${p.id}/`); toast.success("Produit supprimé ou archivé."); reload(); } catch (e) { toast.error(errorMessage(e)); }
  };
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl">Produits</h1><Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" aria-hidden />Nouveau produit</Button></div>
      <form onSubmit={(e) => { e.preventDefault(); const n = new URLSearchParams(); if (search) n.set("search", search); setSp(n); }} className="mb-4 max-w-sm" role="search">
        <TextField label="Rechercher par nom ou référence" value={search} onChange={(e) => setSearch(e.target.value)} />
      </form>
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : data && data.results.length ? (
        <>
          <Table head={["Produit", "Catégorie", "Prix", "Stock", "État", "Actions"]}>
            {data.results.map((p) => (
              <tr key={p.id}>
                <td><p className="font-medium">{p.name}</p><p className="text-xs text-muted">{p.sku}</p></td><td>{p.category_name}</td><td>{formatPrice(p.price)}</td>
                <td className={p.available_stock <= 0 ? "text-danger" : ""}>{p.available_stock}</td>
                <td>{p.is_archived ? "Archivé" : p.is_published ? "Publié" : "Brouillon"}</td>
                <td><div className="flex gap-1"><button onClick={() => setEditing(p)} aria-label={`Modifier ${p.name}`} className="rounded p-2 hover:bg-blush"><Pencil className="h-4 w-4" aria-hidden /></button><button onClick={() => remove(p)} aria-label={`Supprimer ${p.name}`} className="rounded p-2 hover:bg-blush"><Trash2 className="h-4 w-4" aria-hidden /></button></div></td>
              </tr>
            ))}
          </Table>
          <Pagination page={page} count={data.count} pageSize={15} onChange={(p) => { const n = new URLSearchParams(sp); n.set("page", String(p)); setSp(n); }} />
        </>
      ) : <EmptyState title="Aucun produit" text="Créez votre premier produit." action={<Button onClick={() => setEditing("new")}>Nouveau produit</Button>} />}
      {editing && <ProductForm product={editing === "new" ? null : editing} categories={cats.data ?? []} onClose={() => { setEditing(null); reload(); }} />}
    </>
  );
}

function ProductForm({ product, categories, onClose }: { product: AdminProduct | null; categories: Category[]; onClose: () => void }) {
  const [current, setCurrent] = useState<AdminProduct | null>(product);
  const [f, setF] = useState<Record<string, string | boolean>>(product ? {
    category: String(product.category), name: product.name, sku: product.sku, short_description: product.short_description, description: product.description,
    price: String(product.price), compare_at_price: product.compare_at_price ? String(product.compare_at_price) : "", stock: String(product.stock), volume: product.volume,
    ingredients: product.ingredients, usage_tips: product.usage_tips, precautions: product.precautions, is_published: product.is_published } : EMPTY);
  const [err, setErr] = useState<ApiError | null>(null); const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const txt = (k: string, label: string, extra: object = {}) => <TextField label={label} value={String(f[k])} onChange={set(k)} error={err?.field(k)} {...extra} />;

  const save = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    const body = { ...f, category: Number(f.category), price: Number(f.price), stock: Number(f.stock), compare_at_price: f.compare_at_price ? Number(f.compare_at_price) : null };
    try {
      const saved = current ? await patch<AdminProduct>(`/admin/products/${current.id}/`, body) : await post<AdminProduct>("/admin/products/", body);
      setCurrent(saved); toast.success("Produit enregistré.");
    } catch (er) { if (er instanceof ApiError) setErr(er); toast.error(errorMessage(er)); } finally { setBusy(false); }
  };
  const reloadCurrent = async () => { if (!current) return; setCurrent(await get<AdminProduct>(`/admin/products/${current.id}/`)); };
  const upload = async (file: File | undefined) => {
    if (!file || !current) return;
    const fd = new FormData(); fd.append("image", file); fd.append("alt", String(f.name));
    try { await post(`/admin/products/${current.id}/images/`, fd); toast.success("Photo ajoutée."); await reloadCurrent(); } catch (e) { toast.error(errorMessage(e)); }
  };
  const removeImage = async (id: number) => { try { await del(`/admin/products/${current!.id}/images/${id}/`); await reloadCurrent(); } catch (e) { toast.error(errorMessage(e)); } };
  const [v, setV] = useState({ name: "", sku: "", price: "", stock: "0" });
  const addVariant = async () => {
    try { await post("/admin/variants/", { product: current!.id, name: v.name, sku: v.sku, price: v.price ? Number(v.price) : null, stock: Number(v.stock) }); setV({ name: "", sku: "", price: "", stock: "0" }); await reloadCurrent(); }
    catch (e) { toast.error(e instanceof ApiError ? Object.values(e.errors).flat().join(" ") || e.message : errorMessage(e)); }
  };
  const removeVariant = async (id: number) => { try { await del(`/admin/variants/${id}/`); await reloadCurrent(); } catch (e) { toast.error(errorMessage(e)); } };

  return (
    <Modal open onClose={onClose} title={current ? "Modifier le produit" : "Nouveau produit"}>
      <form onSubmit={save} className="space-y-4" noValidate>
        <SelectField label="Catégorie" required value={String(f.category)} onChange={set("category")} error={err?.field("category")}><option value="">Choisir</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</SelectField>
        {txt("name", "Nom", { required: true })}{txt("sku", "Référence SKU", { required: true })}
        <div className="grid grid-cols-2 gap-3">{txt("price", "Prix (FCFA)", { type: "number", min: 0, required: true })}{txt("compare_at_price", "Ancien prix (promotion réelle)", { type: "number", min: 0 })}</div>
        <div className="grid grid-cols-2 gap-3">{txt("stock", "Stock (sans variantes)", { type: "number", min: 0 })}{txt("volume", "Contenance / format")}</div>
        {txt("short_description", "Description courte")}
        <TextArea label="Description" value={String(f.description)} onChange={set("description")} />
        <TextArea label="Composition (fournie par la marque)" value={String(f.ingredients)} onChange={set("ingredients")} />
        <TextArea label="Conseils d'utilisation validés" value={String(f.usage_tips)} onChange={set("usage_tips")} />
        <TextArea label="Précautions" value={String(f.precautions)} onChange={set("precautions")} />
        <CheckField label="Publié sur le site" checked={!!f.is_published} onChange={(e) => setF({ ...f, is_published: e.target.checked })} />
        <Button type="submit" disabled={busy} className="w-full">{busy ? "Enregistrement" : "Enregistrer le produit"}</Button>
      </form>
      {current ? (
        <div className="mt-8 space-y-8 border-t border-line pt-6">
          <section aria-labelledby="photos"><h3 id="photos" className="mb-3 text-xl">Photos</h3>
            <ul className="mb-3 flex flex-wrap gap-2">{current.images.map((im) => <li key={im.id} className="relative"><img src={im.image} alt={im.alt} className="h-20 w-20 rounded-lg object-cover" /><button onClick={() => removeImage(im.id)} aria-label="Supprimer la photo" className="absolute -right-1 -top-1 rounded-full bg-white p-1 shadow"><Trash2 className="h-3.5 w-3.5 text-danger" aria-hidden /></button></li>)}</ul>
            <label className="btn btn-secondary cursor-pointer"><ImagePlus className="h-4 w-4" aria-hidden />Ajouter une photo<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} /></label>
            <p className="mt-1 text-xs text-muted">JPEG, PNG ou WEBP, 5 Mo maximum.</p>
          </section>
          <section aria-labelledby="variantes"><h3 id="variantes" className="mb-3 flex items-center gap-2 text-xl"><Warehouse className="h-5 w-5" aria-hidden />Variantes et stock</h3>
            {current.variants.length > 0 && <ul className="mb-3 divide-y divide-line text-sm">{current.variants.map((x) => <li key={x.id} className="flex items-center justify-between py-2"><span>{x.name} ({x.sku}) : {x.price ? formatPrice(x.price) : "prix du produit"}, stock {x.stock}</span><button onClick={() => removeVariant(x.id)} aria-label={`Supprimer la variante ${x.name}`}><Trash2 className="h-4 w-4 text-danger" aria-hidden /></button></li>)}</ul>}
            <div className="grid grid-cols-2 gap-3"><TextField label="Nom" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /><TextField label="SKU" value={v.sku} onChange={(e) => setV({ ...v, sku: e.target.value })} /><TextField label="Prix (facultatif)" type="number" value={v.price} onChange={(e) => setV({ ...v, price: e.target.value })} /><TextField label="Stock" type="number" min={0} value={v.stock} onChange={(e) => setV({ ...v, stock: e.target.value })} /></div>
            <Button variant="secondary" className="mt-3" onClick={addVariant} disabled={!v.name || !v.sku}>Ajouter la variante</Button>
          </section>
        </div>
      ) : <p className="mt-4 text-xs text-muted">Enregistrez le produit pour ajouter des photos et des variantes.</p>}
    </Modal>
  );
}

/* ---------------- Orders ---------------- */
const STATUSES = [["pending", "En attente"], ["confirmed", "Confirmée"], ["preparing", "En préparation"], ["shipped", "Expédiée"], ["delivered", "Livrée"], ["cancelled", "Annulée"]];
export function AdminOrders() {
  useDocumentTitle("Commandes");
  const [sp, setSp] = useSearchParams();
  const [search, setSearch] = useState(sp.get("search") ?? "");
  const page = Number(sp.get("page") ?? 1);
  const qs = new URLSearchParams({ page: String(page), page_size: "15" });
  for (const k of ["search", "status"]) if (sp.get(k)) qs.set(k, sp.get(k)!);
  const { data, loading, error, reload } = useApi<Paginated<OrderListItem>>(`/admin/orders/?${qs}`);
  const [open, setOpen] = useState<string | null>(null);
  const upd = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); n.delete("page"); setSp(n); };
  return (
    <>
      <Title>Commandes</Title>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <form role="search" onSubmit={(e) => { e.preventDefault(); upd("search", search); }}><TextField label="Rechercher par référence, nom ou téléphone" value={search} onChange={(e) => setSearch(e.target.value)} /></form>
        <SelectField label="Statut" value={sp.get("status") ?? ""} onChange={(e) => upd("status", e.target.value)}><option value="">Tous les statuts</option>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</SelectField>
      </div>
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : data && data.results.length ? (
        <>
          <Table head={["Référence", "Client", "Date", "Total", "Statut", "Paiement"]}>
            {data.results.map((o) => (
              <tr key={o.number}><td><button className="link" onClick={() => setOpen(o.number)}>{o.number}</button></td><td>{o.first_name} {o.last_name}<p className="text-xs text-muted">{o.phone}</p></td><td>{formatDate(o.created_at)}</td><td>{formatPrice(o.total)}</td><td>{o.status_label}</td><td>{o.payment_status_label}</td></tr>
            ))}
          </Table>
          <Pagination page={page} count={data.count} pageSize={15} onChange={(p) => { const n = new URLSearchParams(sp); n.set("page", String(p)); setSp(n); }} />
        </>
      ) : <EmptyState title="Aucune commande" text="Les commandes apparaîtront ici." />}
      {open && <OrderModal number={open} onClose={() => { setOpen(null); reload(); }} />}
    </>
  );
}

function OrderModal({ number, onClose }: { number: string; onClose: () => void }) {
  const { data: o, loading, error, reload } = useApi<Order>(`/admin/orders/${number}/`);
  const [tracking, setTracking] = useState<string | null>(null); const [fee, setFee] = useState(""); const [note, setNote] = useState("");
  const send = async (body: object, msg: string) => { try { await patch(`/admin/orders/${number}/update/`, body); toast.success(msg); reload(); } catch (e) { toast.error(errorMessage(e)); } };
  const label = (s: string) => STATUSES.find(([v]) => v === s)![1];
  return (
    <Modal open onClose={onClose} title={`Commande ${number}`}>
      {loading ? <Spinner /> : error || !o ? <ErrorState message={error ?? "Erreur"} onRetry={reload} /> : (
        <div className="space-y-5 text-sm">
          <p><span className="font-medium">{o.first_name} {o.last_name}</span> · {o.phone}{o.email ? ` · ${o.email}` : ""}<br />{o.address_line}, {o.city} ({o.delivery_zone_name})</p>
          {o.customer_note && <p className="rounded-lg bg-blush p-3">Note : {o.customer_note}</p>}
          <ul className="divide-y divide-line">{o.items.map((i) => <li key={i.id} className="flex justify-between py-1.5"><span>{i.product_name}{i.variant_name ? ` (${i.variant_name})` : ""} x{i.quantity}</span><span>{formatPrice(i.line_total)}</span></li>)}</ul>
          <p>Sous-total {formatPrice(o.subtotal)} · Livraison {o.delivery_fee_pending ? "à confirmer" : formatPrice(o.delivery_fee)} · <strong>Total {formatPrice(o.total)}</strong></p>
          {o.delivery_fee_pending && (
            <div className="flex items-end gap-2"><div className="flex-1"><TextField label="Frais de livraison confirmés (FCFA)" type="number" min={0} value={fee} onChange={(e) => setFee(e.target.value)} /></div><Button variant="secondary" disabled={!fee} onClick={() => send({ delivery_fee: Number(fee) }, "Frais enregistrés.")}>Valider</Button></div>
          )}
          <div><p className="mb-2 font-medium">Statut : {o.status_label}</p>
            <TextField label="Note de changement (facultatif)" value={note} onChange={(e) => setNote(e.target.value)} />
            {/* allowed_transitions provient directement de l'API — toujours synchronisé avec TRANSITIONS backend */}
            <div className="mt-2 flex flex-wrap gap-2">
              {o.allowed_transitions.map((s) => (
                <Button key={s} variant={s === "cancelled" ? "danger" : "primary"}
                  onClick={() => { if (s === "cancelled" && !window.confirm("Annuler la commande ? Le stock sera restitué.")) return; send({ status: s, note }, `Statut : ${label(s)}`); setNote(""); }}>
                  {label(s)}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3"><span className="font-medium">Paiement : {o.payment_status_label}</span>
            {o.payment_status !== "paid" && o.status !== "cancelled" && <Button variant="secondary" onClick={() => { if (window.confirm("Confirmer que le paiement a bien été reçu ?")) send({ payment_status: "paid" }, "Commande marquée payée."); }}>Marquer comme payée</Button>}</div>
          <div className="flex items-end gap-2"><div className="flex-1"><TextField label="Informations de suivi" value={tracking ?? o.tracking_info} onChange={(e) => setTracking(e.target.value)} /></div><Button variant="secondary" onClick={() => send({ tracking_info: tracking ?? o.tracking_info }, "Suivi enregistré.")}>Enregistrer</Button></div>
          <div><p className="mb-1 font-medium">Historique</p><ol className="space-y-1 border-l border-line pl-3">{o.history.map((h, i) => <li key={i}>{h.status_label} <span className="text-muted">· {formatDate(h.created_at)}{h.note ? ` · ${h.note}` : ""}</span></li>)}</ol></div>
        </div>
      )}
    </Modal>
  );
}

/* ---------------- Customers ---------------- */
export function AdminCustomers() {
  useDocumentTitle("Clients");
  const [search, setSearch] = useState(""); const [q, setQ] = useState(""); const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi<Paginated<{ id: number; email: string; first_name: string; last_name: string; phone: string; date_joined: string; orders_count: number }>>(`/admin/customers/?page=${page}&page_size=15${q ? `&search=${encodeURIComponent(q)}` : ""}`);
  return (
    <>
      <Title>Clients</Title>
      <form role="search" className="mb-4 max-w-sm" onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(search); }}><TextField label="Rechercher par nom ou e-mail" value={search} onChange={(e) => setSearch(e.target.value)} /></form>
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : data && data.results.length ? (
        <><Table head={["Nom", "E-mail", "Téléphone", "Inscription", "Commandes"]}>{data.results.map((c) => <tr key={c.id}><td>{c.first_name} {c.last_name}</td><td>{c.email}</td><td>{c.phone}</td><td>{formatDate(c.date_joined)}</td><td>{c.orders_count}</td></tr>)}</Table>
          <Pagination page={page} count={data.count} pageSize={15} onChange={setPage} /></>
      ) : <EmptyState title="Aucun client" />}
    </>
  );
}

/* ---------------- Reviews and messages ---------------- */
export function AdminReviewsMessages() {
  useDocumentTitle("Avis et messages");
  const reviews = useApi<Paginated<{ id: number; product_name: string; user_email: string; rating: number; comment: string; is_approved: boolean }>>("/admin/reviews/");
  const msgs = useApi<Paginated<{ id: number; name: string; email: string; subject: string; message: string; is_read: boolean; created_at: string }>>("/admin/messages/");
  const approve = async (id: number, v: boolean) => { try { await patch(`/admin/reviews/${id}/`, { is_approved: v }); reviews.reload(); } catch (e) { toast.error(errorMessage(e)); } };
  const markRead = async (id: number) => { try { await patch(`/admin/messages/${id}/`, { is_read: true }); msgs.reload(); } catch (e) { toast.error(errorMessage(e)); } };
  return (
    <>
      <Title>Avis et messages</Title>
      <h2 className="mb-3 text-2xl">Avis clients</h2>
      {reviews.loading ? <Spinner /> : reviews.data?.results.length ? (
        <ul className="space-y-3">{reviews.data.results.map((r) => <li key={r.id} className="card flex flex-wrap items-start justify-between gap-3 p-4 text-sm"><div><p className="font-medium">{r.product_name} : {r.rating}/5</p><p className="text-muted">{r.comment}</p><p className="text-xs text-muted">{r.user_email}</p></div><Button variant={r.is_approved ? "ghost" : "primary"} onClick={() => approve(r.id, !r.is_approved)}>{r.is_approved ? "Retirer" : "Publier"}</Button></li>)}</ul>
      ) : <p className="text-sm text-muted">Aucun avis pour le moment.</p>}
      <h2 className="mb-3 mt-10 text-2xl">Messages de contact</h2>
      {msgs.loading ? <Spinner /> : msgs.data?.results.length ? (
        <ul className="space-y-3">{msgs.data.results.map((m) => <li key={m.id} className="card p-4 text-sm"><div className="flex justify-between gap-3"><p className="font-medium">{m.subject}{!m.is_read && <span className="ml-2 rounded-full bg-plum px-2 py-0.5 text-xs text-ivory">Nouveau</span>}</p><span className="text-xs text-muted">{formatDate(m.created_at)}</span></div><p className="mt-1 whitespace-pre-line text-muted">{m.message}</p><p className="mt-2 text-xs">{m.name} · {m.email}</p>{!m.is_read && <Button variant="ghost" className="mt-1" onClick={() => markRead(m.id)}>Marquer comme lu</Button>}</li>)}</ul>
      ) : <p className="text-sm text-muted">Aucun message.</p>}
    </>
  );
}

/* ---------------- Settings (store, zones, categories) ---------------- */
export function AdminSettings() {
  useDocumentTitle("Paramètres");
  return (<><Title>Paramètres de la boutique</Title><StoreForm /><Zones /><Categories /></>);
}

function StoreForm() {
  const { data, loading, error, reload } = useApi<StoreSettings & { low_stock_threshold: number }>("/admin/settings/");
  const [f, setF] = useState<Record<string, string | boolean> | null>(null); const [err, setErr] = useState<ApiError | null>(null);
  // Initialiser le formulaire une seule fois à la réception des données, puis à chaque reload explicite.
  useEffect(() => {
    if (!data) return;
    setF(Object.fromEntries(
      Object.entries(data).filter(([k]) => k !== "logo").map(([k, v]) => [k, v ?? ""])
    ) as Record<string, string | boolean>);
  }, [data]);
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorState message={error ?? "Erreur"} onRetry={reload} />;
  if (!f) return <Spinner />;
  const set = (k: string) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const t = (k: string, label: string, extra: object = {}) => <TextField label={label} value={String(f[k] ?? "")} onChange={set(k)} error={err?.field(k)} {...extra} />;
  const save = async (e: FormEvent) => {
    e.preventDefault(); setErr(null);
    try { await patch("/admin/settings/", { ...f, low_stock_threshold: Number(f.low_stock_threshold) }); toast.success("Paramètres enregistrés."); reload(); }
    catch (er) { if (er instanceof ApiError) setErr(er); toast.error(errorMessage(er)); }
  };
  const uploadLogo = async (file?: File) => { if (!file) return; const fd = new FormData(); fd.append("logo", file); try { await patch("/admin/settings/", fd); toast.success("Logo mis à jour."); reload(); } catch (e) { toast.error(errorMessage(e)); } };
  return (
    <form onSubmit={save} className="card mb-10 space-y-4 p-6" noValidate>
      <h2 className="text-2xl">Boutique</h2>
      <div className="grid gap-4 sm:grid-cols-2">{t("name", "Nom de la boutique")}{t("tagline", "Slogan")}{t("contact_email", "E-mail de contact", { type: "email" })}{t("contact_phone", "Téléphone")}{t("address", "Adresse")}
        {t("whatsapp_number", "Numéro WhatsApp", { hint: "Format international, chiffres uniquement (ex. 221770000000)." })}{t("instagram_url", "Instagram (URL)")}{t("facebook_url", "Facebook (URL)")}{t("tiktok_url", "TikTok (URL)")}{t("low_stock_threshold", "Seuil de stock faible", { type: "number", min: 0 })}</div>
      {t("announcement_text", "Bandeau d'annonce")}
      <TextArea label="Texte du footer" rows={3} value={String(f.footer_text ?? "")} onChange={set("footer_text")} />
      <TextArea label="Procédure si la zone de livraison n'est pas configurée" rows={3} value={String(f.unknown_zone_policy ?? "")} onChange={set("unknown_zone_policy")} />
      <CheckField label="Afficher le bandeau d'annonce" checked={!!f.announcement_active} onChange={(e) => setF({ ...f, announcement_active: e.target.checked })} />
      <CheckField label="Autoriser la commande sans compte" checked={!!f.guest_checkout_enabled} onChange={(e) => setF({ ...f, guest_checkout_enabled: e.target.checked })} />
      <CheckField label="Proposer le paiement à la livraison (seul mode de règlement manuel)" checked={!!f.payment_cash_on_delivery} onChange={(e) => setF({ ...f, payment_cash_on_delivery: e.target.checked })} />
      <div className="flex flex-wrap items-center gap-3"><Button type="submit">Enregistrer les paramètres</Button>
        <label className="btn btn-secondary cursor-pointer"><ImagePlus className="h-4 w-4" aria-hidden />Changer le logo<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => uploadLogo(e.target.files?.[0])} /></label></div>
    </form>
  );
}

function Zones() {
  const { data, loading, error, reload } = useApi<(DeliveryZone & { is_active: boolean })[]>("/admin/delivery-zones/");
  const [z, setZ] = useState({ name: "", fee: "", info: "" });
  const add = async (e: FormEvent) => { e.preventDefault(); try { await post("/admin/delivery-zones/", { name: z.name, fee: Number(z.fee), info: z.info }); setZ({ name: "", fee: "", info: "" }); reload(); } catch (er) { toast.error(er instanceof ApiError ? Object.values(er.errors).flat().join(" ") || er.message : errorMessage(er)); } };
  const toggle = async (id: number, v: boolean) => { try { await patch(`/admin/delivery-zones/${id}/`, { is_active: v }); reload(); } catch (e) { toast.error(errorMessage(e)); } };
  const setFee = async (id: number, fee: string) => { try { await patch(`/admin/delivery-zones/${id}/`, { fee: Number(fee) }); toast.success("Frais mis à jour."); reload(); } catch (e) { toast.error(errorMessage(e)); } };
  return (
    <section className="card mb-10 p-6" aria-labelledby="zones"><h2 id="zones" className="mb-4 text-2xl">Zones et frais de livraison</h2>
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <ul className="mb-4 divide-y divide-line text-sm">{data?.map((x) => (
          <li key={x.id} className="flex flex-wrap items-center justify-between gap-3 py-2"><span className={x.is_active ? "" : "text-muted line-through"}>{x.name}</span>
            <span className="flex items-center gap-2"><label className="sr-only" htmlFor={`fee-${x.id}`}>Frais pour {x.name}</label><input id={`fee-${x.id}`} className="input !w-28" type="number" min={0} defaultValue={x.fee} onBlur={(e) => Number(e.target.value) !== x.fee && setFee(x.id, e.target.value)} />FCFA
              <Button variant="ghost" onClick={() => toggle(x.id, !x.is_active)}>{x.is_active ? "Désactiver" : "Activer"}</Button></span></li>))}</ul>)}
      <form onSubmit={add} className="grid gap-3 sm:grid-cols-4"><TextField label="Zone" required value={z.name} onChange={(e) => setZ({ ...z, name: e.target.value })} /><TextField label="Frais (FCFA)" type="number" min={0} required value={z.fee} onChange={(e) => setZ({ ...z, fee: e.target.value })} /><TextField label="Informations" value={z.info} onChange={(e) => setZ({ ...z, info: e.target.value })} /><div className="flex items-end"><Button type="submit" className="w-full">Ajouter la zone</Button></div></form>
    </section>
  );
}

function Categories() {
  const { data, loading, error, reload } = useApi<(Category & { is_active: boolean })[]>("/admin/categories/");
  const [c, setC] = useState({ name: "", description: "" });
  const add = async (e: FormEvent) => { e.preventDefault(); try { await post("/admin/categories/", c); setC({ name: "", description: "" }); toast.success("Catégorie ajoutée."); reload(); } catch (er) { toast.error(er instanceof ApiError ? Object.values(er.errors).flat().join(" ") || er.message : errorMessage(er)); } };
  const toggle = async (id: number, v: boolean) => { try { await patch(`/admin/categories/${id}/`, { is_active: v }); reload(); } catch (e) { toast.error(errorMessage(e)); } };
  return (
    <section className="card p-6" aria-labelledby="cats"><h2 id="cats" className="mb-4 text-2xl">Catégories</h2>
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <ul className="mb-4 divide-y divide-line text-sm">{data?.map((x) => <li key={x.id} className="flex items-center justify-between py-2"><span className={x.is_active ? "" : "text-muted line-through"}>{x.name}</span><Button variant="ghost" onClick={() => toggle(x.id, !x.is_active)}>{x.is_active ? "Désactiver" : "Activer"}</Button></li>)}</ul>)}
      <form onSubmit={add} className="grid gap-3 sm:grid-cols-3"><TextField label="Nouvelle catégorie" required value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} /><TextField label="Description" value={c.description} onChange={(e) => setC({ ...c, description: e.target.value })} /><div className="flex items-end"><Button type="submit" className="w-full">Ajouter la catégorie</Button></div></form>
      <p className="mt-3 flex items-center gap-1 text-xs text-muted"><TriangleAlert className="h-3.5 w-3.5" aria-hidden />Une catégorie contenant des produits ne peut pas être supprimée, seulement désactivée.</p>
    </section>
  );
}
