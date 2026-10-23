import { SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import { ProductCard } from "../components/ProductCard";
import { Button } from "../components/ui/Button";
import { SelectField, TextField } from "../components/ui/Field";
import { Pagination } from "../components/ui/Pagination";
import { EmptyState, ErrorState, Spinner } from "../components/ui/States";
import { useApi, useDocumentTitle } from "../hooks/useApi";
import type { Category, Paginated, ProductListItem } from "../types";

const PAGE_SIZE = 12;

export default function Shop() {
  const { slug } = useParams();
  const [sp, setSp] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const cats = useApi<Category[]>("/categories/");
  const current = cats.data?.find((c) => c.slug === slug);
  useDocumentTitle(current?.name ?? "Boutique", current?.description || "Catalogue des produits Mamy Khaliqa.");

  const page = Number(sp.get("page") ?? 1);
  const q = new URLSearchParams();
  const category = slug ?? sp.get("category");
  if (category) q.set("category", category);
  for (const k of ["search", "min_price", "max_price", "in_stock"]) if (sp.get(k)) q.set(k, sp.get(k)!);
  q.set("ordering", sp.get("ordering") ?? "-created_at");
  q.set("page", String(page));
  q.set("page_size", String(PAGE_SIZE));
  const { data, error, loading, reload } = useApi<Paginated<ProductListItem>>(`/products/?${q}`);

  const [min, setMin] = useState(sp.get("min_price") ?? "");
  const [max, setMax] = useState(sp.get("max_price") ?? "");
  useEffect(() => { setMin(sp.get("min_price") ?? ""); setMax(sp.get("max_price") ?? ""); }, [sp]);

  const update = (k: string, v: string) => {
    const n = new URLSearchParams(sp);
    if (v) n.set(k, v);
    else n.delete(k);
    n.delete("page");
    setSp(n);
  };
  const applyPrice = () => {
    const n = new URLSearchParams(sp);
    if (min) n.set("min_price", min); else n.delete("min_price");
    if (max) n.set("max_price", max); else n.delete("max_price");
    n.delete("page");
    setSp(n);
  };

  const filters = (
    <div className="space-y-5">
      {!slug && (
        <SelectField label="Catégorie" value={sp.get("category") ?? ""} onChange={(e) => update("category", e.target.value)}>
          <option value="">Toutes les catégories</option>
          {cats.data?.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </SelectField>
      )}
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Prix min (FCFA)" type="number" min={0} inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} />
        <TextField label="Prix max (FCFA)" type="number" min={0} inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} />
      </div>
      <Button variant="secondary" onClick={applyPrice} className="w-full">Appliquer le prix</Button>
      <SelectField label="Disponibilité" value={sp.get("in_stock") ?? ""} onChange={(e) => update("in_stock", e.target.value)}>
        <option value="">Tous les produits</option>
        <option value="true">En stock uniquement</option>
      </SelectField>
      <Button variant="ghost" onClick={() => setSp(new URLSearchParams())} className="w-full">Réinitialiser les filtres</Button>
    </div>
  );

  return (
    <div className="container-page py-10">
      <h1 className="text-4xl">{current?.name ?? "La boutique"}</h1>
      {current?.description && <p className="mt-2 max-w-2xl text-muted">{current.description}</p>}
      {sp.get("search") && <p className="mt-2 text-sm text-muted">Résultats pour « {sp.get("search")} »</p>}

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside>
          <button className="btn btn-secondary mb-4 w-full lg:hidden" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((o) => !o)}>
            <SlidersHorizontal className="h-4 w-4" aria-hidden />Filtres
          </button>
          <div className={`${filtersOpen ? "block" : "hidden"} lg:block`}>{filters}</div>
        </aside>
        <div>
          <div className="mb-5 flex items-center justify-between gap-4">
            <p className="text-sm text-muted" aria-live="polite">{data ? `${data.count} produit${data.count > 1 ? "s" : ""}` : ""}</p>
            <div className="w-56">
              <SelectField label="Trier par" value={sp.get("ordering") ?? "-created_at"} onChange={(e) => update("ordering", e.target.value)}>
                <option value="-created_at">Nouveautés</option>
                <option value="price">Prix croissant</option>
                <option value="-price">Prix décroissant</option>
              </SelectField>
            </div>
          </div>
          {loading ? <Spinner label="Chargement des produits" /> : error ? <ErrorState message={error} onRetry={reload} /> :
            data && data.results.length === 0 ? (
              <EmptyState title="Aucun produit trouvé" text="Modifiez vos filtres ou votre recherche." action={<Button variant="secondary" onClick={() => setSp(new URLSearchParams())}>Voir tous les produits</Button>} />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">{data?.results.map((p) => <ProductCard key={p.id} product={p} />)}</div>
                <Pagination page={page} count={data?.count ?? 0} pageSize={PAGE_SIZE} onChange={(p) => { const n = new URLSearchParams(sp); n.set("page", String(p)); setSp(n); window.scrollTo(0, 0); }} />
              </>
            )}
        </div>
      </div>
    </div>
  );
}
