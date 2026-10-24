import { Tag } from "lucide-react";

import { ProductCard, ProductCardSkeleton } from "../components/ProductCard";
import { Pagination } from "../components/ui/Pagination";
import { EmptyState, ErrorState } from "../components/ui/States";
import { useApi, useDocumentTitle } from "../hooks/useApi";
import { useSearchParams } from "react-router-dom";
import type { Paginated, ProductListItem } from "../types";

const PAGE_SIZE = 12;

/**
 * Page /promotions — liste tous les produits avec un ancien prix (compare_at_price != null).
 * Les données viennent uniquement de l'API via le filtre has_promo=true.
 * Aucun pourcentage ni texte promotionnel inventé.
 */
export default function Promotions() {
  useDocumentTitle("Promotions", "Découvrez les produits Mamy Khaliqa en promotion.");
  const [sp, setSp] = useSearchParams();
  const page = Number(sp.get("page") ?? 1);

  const { data, loading, error, reload } = useApi<Paginated<ProductListItem>>(
    `/products/?has_promo=true&page=${page}&page_size=${PAGE_SIZE}&ordering=-created_at`,
  );

  return (
    <div className="container-page py-10">
      {/* En-tête */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blush">
          <Tag className="h-5 w-5 text-plum" aria-hidden />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Promotions</h1>
          {data && (
            <p className="mt-0.5 text-sm text-muted">
              {data.count} produit{data.count > 1 ? "s" : ""} en promotion
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : data && data.results.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {data.results.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          <Pagination
            page={page}
            count={data.count}
            pageSize={PAGE_SIZE}
            onChange={(p) => {
              const n = new URLSearchParams(sp);
              n.set("page", String(p));
              setSp(n);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </>
      ) : (
        <EmptyState
          title="Aucune promotion en ce moment"
          text="Revenez bientôt, de nouvelles offres arrivent régulièrement."
        />
      )}
    </div>
  );
}
