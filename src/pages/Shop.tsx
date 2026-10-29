import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import { ProductCard } from "../components/ProductCard";
import { Button } from "../components/ui/Button";
import { SelectField, TextField } from "../components/ui/Field";
import { Pagination } from "../components/ui/Pagination";
import { EmptyState, ErrorState, SkeletonCard } from "../components/ui/States";
import { useApi, useDocumentTitle } from "../hooks/useApi";
import type { Category, Paginated, ProductListItem } from "../types";

const PAGE_SIZE = 12;

export default function Shop() {
  const { slug } = useParams();
  const [sp, setSp] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const cats    = useApi<Category[]>("/categories/");
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
    if (v) n.set(k, v); else n.delete(k);
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
  const hasFilters = ["search", "min_price", "max_price", "in_stock", "category"].some((k) => sp.get(k));

  /* Panneau filtres */
  const filtersPanel = (
    <div className="space-y-5 min-w-0">
      {!slug && (
        <SelectField label="Catégorie" value={sp.get("category") ?? ""} onChange={(e) => update("category", e.target.value)}>
          <option value="">Toutes les catégories</option>
          {cats.data?.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </SelectField>
      )}

      <fieldset className="space-y-3">
        <legend className="mb-1.5 text-sm font-semibold text-ink">Fourchette de prix (FCFA)</legend>
        <div className="grid grid-cols-2 gap-2">
          <TextField label="Min" type="number" min={0} inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} />
          <TextField label="Max" type="number" min={0} inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} />
        </div>
        <Button variant="secondary" onClick={applyPrice} className="w-full !rounded-xl">
          Appliquer
        </Button>
      </fieldset>

      <SelectField label="Disponibilité" value={sp.get("in_stock") ?? ""} onChange={(e) => update("in_stock", e.target.value)}>
        <option value="">Tous les produits</option>
        <option value="true">En stock uniquement</option>
      </SelectField>

      {hasFilters && (
        <button
          onClick={() => setSp(new URLSearchParams())}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-line py-2.5 text-sm font-medium text-muted transition-colors hover:border-danger/40 hover:bg-danger/5 hover:text-danger"
        >
          <X className="h-4 w-4" aria-hidden />
          Réinitialiser les filtres
        </button>
      )}
    </div>
  );

  return (
    <div className="container-page py-10 min-w-0">
      {/* En-tête */}
      <div className="mb-8 min-w-0">
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink break-words">
          {current?.name ?? "La boutique"}
        </h1>
        {current?.description && (
          <p className="mt-2 max-w-2xl text-muted">{current.description}</p>
        )}
        {sp.get("search") && (
          <p className="mt-2 flex items-center gap-2 text-sm text-muted flex-wrap">
            Résultats pour
            <span className="rounded-full bg-blush px-2.5 py-0.5 font-medium text-ink">
              « {sp.get("search")} »
            </span>
          </p>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr] min-w-0">
        {/* Sidebar filtres */}
        <aside className="min-w-0">
          {/* Toggle mobile */}
          <button
            className="mb-4 flex w-full items-center justify-between gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold shadow-xs transition-colors hover:border-plum/40 lg:hidden"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((o) => !o)}
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-plum" aria-hidden />
              Filtres
            </span>
            {hasFilters && (
              <span className="rounded-full bg-plum px-2 py-0.5 text-[10px] font-bold text-ivory">Actifs</span>
            )}
          </button>

          {/* Panel filtres desktop / mobile ouvert */}
          <div className={`${filtersOpen ? "block" : "hidden"} rounded-2xl border border-line bg-white p-5 shadow-xs lg:block`}>
            {filtersPanel}
          </div>
        </aside>

        {/* Produits */}
        <div className="min-w-0">
          {/* Barre de tri */}
          <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-muted" aria-live="polite">
              {data ? (
                <span>
                  <span className="font-semibold text-ink">{data.count}</span>{" "}
                  produit{data.count > 1 ? "s" : ""}
                </span>
              ) : null}
            </p>
            <div className="w-full sm:w-52 min-w-0">
              <SelectField label="Trier par" value={sp.get("ordering") ?? "-created_at"} onChange={(e) => update("ordering", e.target.value)}>
                <option value="-created_at">Nouveautés</option>
                <option value="price">Prix croissant</option>
                <option value="-price">Prix décroissant</option>
              </SelectField>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : data && data.results.length === 0 ? (
            <EmptyState
              title="Aucun produit trouvé"
              text="Modifiez vos filtres ou votre recherche."
              action={<Button variant="secondary" onClick={() => setSp(new URLSearchParams())}>Voir tous les produits</Button>}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                {data?.results.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              <Pagination
                page={page} count={data?.count ?? 0} pageSize={PAGE_SIZE}
                onChange={(p) => {
                  const n = new URLSearchParams(sp);
                  n.set("page", String(p));
                  setSp(n);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
