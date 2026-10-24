import { create } from "zustand";

import { ApiError, get, post } from "../lib/api";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  ready: boolean;
  load: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (data: Record<string, unknown>) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (u: User) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  ready: false,

  /**
   * Réhydrate l'utilisateur depuis le cookie de session (GET /auth/me/).
   * Appelé au mount de l'App. Passe toujours ready=true pour ne pas
   * bloquer le rendu des routes publiques.
   */
  load: async () => {
    try {
      set({ user: await get<User>("/auth/me/"), ready: true });
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        set({ user: null, ready: true });
      } else {
        // Erreur réseau ou serveur : on considère l'utilisateur non connecté
        // mais on laisse prêt pour ne pas bloquer l'interface.
        set({ user: null, ready: true });
      }
    }
  },

  login: async (email, password) => {
    const user = await post<User>("/auth/login/", { email, password });
    set({ user });
    return user;
  },

  register: async (data) => {
    const user = await post<User>("/auth/register/", data);
    set({ user });
    return user;
  },

  /**
   * Déconnexion complète :
   * 1. POST /auth/logout/ côté serveur (flush session Django + cookie sessionid).
   * 2. Remise à zéro du state user dans Zustand.
   * 3. Remise à zéro des stores liés à l'utilisateur (favorites, etc.).
   * 4. En cas d'erreur réseau, la session côté serveur est peut-être encore active,
   *    mais on réinitialise quand même le state local pour une déconnexion UX propre.
   */
  logout: async () => {
    try {
      await post("/auth/logout/");
    } catch {
      // Erreur réseau ou session déjà expirée — on continue quand même
      // pour garantir la déconnexion côté client.
    } finally {
      set({ user: null });
      // Réinitialiser les stores liés à l'utilisateur (import dynamique
      // pour éviter les dépendances circulaires au niveau module)
      import("./favorites").then(({ useFavorites }) => useFavorites.getState().reset());
    }
  },

  setUser: (user) => set({ user }),
}));
