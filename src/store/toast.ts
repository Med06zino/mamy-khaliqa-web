import { create } from "zustand";

export interface Toast { id: number; kind: "success" | "error" | "info"; message: string }
interface S { toasts: Toast[]; push: (kind: Toast["kind"], message: string) => void; dismiss: (id: number) => void }
let n = 0;
export const useToast = create<S>((set) => ({
  toasts: [],
  push: (kind, message) => {
    const id = ++n;
    set((s) => ({ toasts: [...s.toasts, { id, kind, message }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4500);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
export const toast = {
  success: (m: string) => useToast.getState().push("success", m),
  error: (m: string) => useToast.getState().push("error", m),
  info: (m: string) => useToast.getState().push("info", m),
};
