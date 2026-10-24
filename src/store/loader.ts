import { create } from "zustand";

/**
 * Contrôle centralisé du loader global.
 *
 * Utilisation :
 *   useLoader.getState().show()   → afficher le loader
 *   useLoader.getState().hide()   → masquer (fondu sortant)
 *
 * Le compteur de référence (refCount) permet de gérer plusieurs
 * appels concurrents : le loader ne se masque que quand TOUS les
 * appelants ont appelé hide().
 */
interface LoaderState {
  visible: boolean;
  refCount: number;
  show: () => void;
  hide: () => void;
  /** Masque immédiatement sans délai (reset total) */
  forceHide: () => void;
}

export const useLoader = create<LoaderState>((set, get) => ({
  visible: false,
  refCount: 0,

  show: () =>
    set((s) => ({
      visible: true,
      refCount: s.refCount + 1,
    })),

  hide: () => {
    const next = Math.max(0, get().refCount - 1);
    set({ refCount: next, visible: next > 0 });
  },

  forceHide: () => set({ visible: false, refCount: 0 }),
}));
