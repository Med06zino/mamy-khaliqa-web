import { ImageOff } from "lucide-react";
import { Link } from "react-router-dom";

import type { Category } from "../types";

interface Props {
  category: Category;
}

/**
 * Carte carrée de catégorie — reproduit la maquette 1.
 * Fond teinté, image de la catégorie (si présente), nom en bas.
 */
export function CategoryCard({ category: c }: Props) {
  return (
    <Link
      to={`/boutique/categorie/${c.slug}`}
      className="card-category group flex flex-col overflow-hidden"
      aria-label={`Voir la catégorie ${c.name}`}
    >
      {/* Zone image — carré */}
      <div className="relative aspect-square overflow-hidden bg-blush-deep">
        {c.image ? (
          <img
            src={c.image}
            alt={c.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageOff className="h-8 w-8 text-plum/20" aria-label="Photo à venir" />
          </div>
        )}
      </div>

      {/* Nom */}
      <div className="px-3 py-3 text-center">
        <p className="font-display text-sm font-semibold text-ink group-hover:text-plum transition-colors">
          {c.name}
        </p>
        {c.product_count > 0 && (
          <p className="mt-0.5 text-xs text-muted">
            {c.product_count} produit{c.product_count > 1 ? "s" : ""}
          </p>
        )}
      </div>
    </Link>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="card-category overflow-hidden">
      <div className="skeleton aspect-square w-full rounded-none" />
      <div className="space-y-1.5 px-3 py-3">
        <div className="skeleton mx-auto h-4 w-2/3 rounded-full" />
        <div className="skeleton mx-auto h-3 w-1/2 rounded-full" />
      </div>
    </div>
  );
}
