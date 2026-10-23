import { create } from "zustand";

import { del, get, post } from "../lib/api";
import type { ProductListItem } from "../types";

interface F { ids: Set<number>; loaded: boolean; load: () => Promise<void>; toggle: (productId: number) => Promise<boolean>; reset: () => void }
export const useFavorites = create<F>((set, getState) => ({
  ids: new Set(),
  loaded: false,
  load: async () => {
    const favs = await get<{ product: ProductListItem }[]>("/favorites/");
    set({ ids: new Set(favs.map((f) => f.product.id)), loaded: true });
  },
  toggle: async (productId) => {
    const has = getState().ids.has(productId);
    if (has) await del(`/favorites/${productId}/`);
    else await post("/favorites/", { product_id: productId });
    const next = new Set(getState().ids);
    if (has) next.delete(productId);
    else next.add(productId);
    set({ ids: next });
    return !has;
  },
  reset: () => set({ ids: new Set(), loaded: false }),
}));
