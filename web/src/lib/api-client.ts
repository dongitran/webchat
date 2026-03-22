import { useAuthStore } from "@/stores/auth.store.js";
import type { IUser } from "@webchat/shared";

const API_BASE = "/api/v1";

class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export { ApiError };

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, { method: "POST", credentials: "include" });
    if (res.ok) {
      const data = (await res.json()) as { accessToken: string };
      return data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const { accessToken } = useAuthStore.getState();

  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const { user } = useAuthStore.getState();
      if (user) useAuthStore.getState().setAuth(newToken, user);
      return request<T>(path, init, false);
    }
    useAuthStore.getState().clearAuth();
    throw new ApiError(401, "UNAUTHORIZED", "Session expired");
  }

  if (res.ok) {
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  const body = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
  throw new ApiError(res.status, body.code ?? "UNKNOWN", body.error ?? "Request failed");
}

function toBody(body: unknown): string | undefined {
  if (body === undefined) return;
  return JSON.stringify(body);
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: toBody(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: toBody(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export type AuthMeResponse = { user: IUser };
