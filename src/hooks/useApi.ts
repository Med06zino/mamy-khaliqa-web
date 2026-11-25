import { useCallback, useEffect, useRef, useState } from "react";

import { errorMessage, get } from "../lib/api";
import type { Category } from "../types";

/** Charge une ressource GET avec etats de chargement et d'erreur explicites. */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(path !== null);
  const [tick, setTick] = useState(0);
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    if (path === null) {
      previousPath.current = null;
      setLoading(false);
      setError(null);
      return;
    }

    if (previousPath.current !== path) {
      previousPath.current = path;
      setData(null);
    }

    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    get<T>(path, ctrl.signal)
      .then((d) => setData(d))
      .catch((e) => { if (!ctrl.signal.aborted) setError(errorMessage(e)); })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [path, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload };
}

const CATEGORY_CACHE_MS = 60_000;
let categoriesCache: Category[] | null = null;
let categoriesCachedAt = 0;
let categoriesInFlight: Promise<Category[]> | null = null;

/** Liste des catégories partagée entre l'en-tête, l'accueil et la boutique. */
export function useCategories() {
  const [data, setData] = useState<Category[] | null>(categoriesCache);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(categoriesCache === null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;

    if (tick === 0 && categoriesCache && Date.now() - categoriesCachedAt < CATEGORY_CACHE_MS) {
      setData(categoriesCache);
      setError(null);
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    setError(null);

    if (!categoriesInFlight) {
      categoriesInFlight = get<Category[]>("/categories/")
        .then((d) => {
          categoriesCache = d;
          categoriesCachedAt = Date.now();
          return d;
        })
        .finally(() => { categoriesInFlight = null; });
    }

    categoriesInFlight
      .then((d) => { if (active) setData(d); })
      .catch((e) => { if (active) setError(errorMessage(e)); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload };
}

export function useDocumentTitle(title: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} | Mamy Khaliqa` : "Mamy Khaliqa";
    if (description) document.querySelector('meta[name="description"]')?.setAttribute("content", description);
  }, [title, description]);
}
