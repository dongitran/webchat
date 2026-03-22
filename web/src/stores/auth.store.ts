import { create } from "zustand";
import type { IUser } from "@webchat/shared";

interface AuthState {
  accessToken: string | null;
  user: IUser | null;
  isAuthenticated: boolean;
  setAuth: (accessToken: string, user: IUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  setAuth: (accessToken, user) => set({ accessToken, user, isAuthenticated: true }),
  clearAuth: () => set({ accessToken: null, user: null, isAuthenticated: false }),
}));
