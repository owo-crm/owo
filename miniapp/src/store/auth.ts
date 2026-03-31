import { create } from "zustand";

type AuthUser = {
  id: string;
  telegramId: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  language: string;
};

type AuthState = {
  isPlatformAdmin: boolean;
  telegramId: string | null;
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  setPlatformAdmin: (value: boolean) => void;
  hydrateAuth: (payload: {
    token: string;
    telegramId: string;
    isPlatformAdmin: boolean;
    user: AuthUser;
  }) => void;
  setLoading: (value: boolean) => void;
  setError: (value: string | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isPlatformAdmin: false,
  telegramId: null,
  token: null,
  user: null,
  isLoading: true,
  error: null,
  setPlatformAdmin: (value) => set({ isPlatformAdmin: value }),
  hydrateAuth: (payload) =>
    set({
      token: payload.token,
      telegramId: payload.telegramId,
      isPlatformAdmin: payload.isPlatformAdmin,
      user: payload.user,
      isLoading: false,
      error: null,
    }),
  setLoading: (value) => set({ isLoading: value }),
  setError: (value) => set({ error: value, isLoading: false }),
}));
