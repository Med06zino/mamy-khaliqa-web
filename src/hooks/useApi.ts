import { useCallback, useEffect, useState } from "react";

import { errorMessage, get } from "../lib/api";

/** Charge une ressource GET avec etats de chargement et d'erreur explicites. */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(path !== null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (path === null) return;
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    get<T>(path, ctrl.signal)
      .then((d) => setData(d))
      .catch((e) => { if ((e as Error).name !== "AbortError") setError(errorMessage(e)); })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [path, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload };
}

export function useDocumentTitle(title: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} | Mamy Khaliqa` : "Mamy Khaliqa";
    if (description) document.querySelector('meta[name="description"]')?.setAttribute("content", description);
  }, [title, description]);
}
