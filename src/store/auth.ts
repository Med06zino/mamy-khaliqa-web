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
  load: async () => {
    try {
      set({ user: await get<User>("/auth/me/"), ready: true });
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) set({ user: null, ready: true });
      else set({ ready: true });
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
  logout: async () => {
    await post("/auth/logout/");
    set({ user: null });
  },
  setUser: (user) => set({ user }),
}));
