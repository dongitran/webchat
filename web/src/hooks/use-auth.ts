import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth.store.js";
import { apiClient, type AuthMeResponse } from "@/lib/api-client.js";

interface UseAuthReturn {
  isLoading: boolean;
  login: () => void;
  logout: () => Promise<void>;
}

function login(): void {
  globalThis.location.href = "/api/v1/auth/google";
}

export function useAuth(): UseAuthReturn {
  const [isLoading, setIsLoading] = useState(true);
  const { setAuth, clearAuth, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(false);
      return;
    }

    // Attempt silent refresh using httpOnly cookie
    async function silentRefresh(): Promise<void> {
      try {
        const res = await fetch("/api/v1/auth/refresh", {
          method: "POST",
          credentials: "include",
        });

        if (res.ok) {
          const { accessToken } = (await res.json()) as { accessToken: string };
          const meRes = await apiClient.get<AuthMeResponse>("/auth/me");
          setAuth(accessToken, meRes.user);
        }
      } catch {
        // No valid session — remain unauthenticated
      } finally {
        setIsLoading(false);
      }
    }

    void silentRefresh();
  }, [isAuthenticated, setAuth]);

  async function logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      clearAuth();
      await navigate({ to: "/login" });
    }
  }

  return { isLoading, login, logout };
}
