import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Le panier ne sert qu'a l'affichage : le serveur recalcule prix et stock a la commande. */
export interface CartItem {
  key: string; productId: number; variantId: number | null; slug: string; name: string; variantName: string;
  image: string | null; unitPrice: number; quantity: number; maxStock: number;
}
interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, "key" | "quantity">, qty?: number) => "added" | "limit";
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}
export const cartKey = (productId: number, variantId: number | null) => `${productId}:${variantId ?? 0}`;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, qty = 1) => {
        const key = cartKey(item.productId, item.variantId);
        const existing = get().items.find((i) => i.key === key);
        const wanted = (existing?.quantity ?? 0) + qty;
        const capped = Math.min(wanted, item.maxStock);
        if (capped <= 0) return "limit";
        set((s) => ({
          items: existing
            ? s.items.map((i) => (i.key === key ? { ...i, ...item, quantity: capped } : i))
            : [...s.items, { ...item, key, quantity: capped }],
        }));
        return capped < wanted ? "limit" : "added";
      },
      setQty: (key, qty) =>
        set((s) => ({
          items: s.items.map((i) => (i.key === key ? { ...i, quantity: Math.max(1, Math.min(qty, i.maxStock)) } : i)),
        })),
      remove: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [] }),
    }),
    { name: "mk-cart" },
  ),
);
export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0);
export const cartSubtotal = (items: CartItem[]) => items.reduce((n, i) => n + i.unitPrice * i.quantity, 0);
