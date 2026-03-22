import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { IUser } from "@webchat/shared";
import { useAuthStore } from "@/stores/auth.store.js";
import { useAuth } from "@/hooks/use-auth.js";

const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

const { mockApiClient } = vi.hoisted(() => ({
  mockApiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("@/lib/api-client.js", () => ({
  apiClient: mockApiClient,
}));

const mockUser: IUser = {
  _id: "user-1",
  googleId: "google-1",
  email: "test@example.com",
  displayName: "Test User",
  avatarUrl: null,
  status: "online",
  lastSeenAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.resetAllMocks();
  mockNavigate.mockResolvedValue();
  useAuthStore.setState({ accessToken: null, user: null, isAuthenticated: false });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  useAuthStore.setState({ accessToken: null, user: null, isAuthenticated: false });
});

describe("useAuth hook", () => {
  it("starts with isLoading=true before effect settles", () => {
    const { result } = renderHook(() => useAuth());
    // Synchronous initial render — effect has not run yet
    expect(result.current.isLoading).toBe(true);
  });

  it("sets isLoading=false after silent refresh fails", async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("sets auth when silent refresh succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ accessToken: "new-tok" }),
      }),
    );
    mockApiClient.get.mockResolvedValue({ user: mockUser });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).toMatchObject({ email: "test@example.com" });
  });

  it("sets isLoading=false immediately when already authenticated", async () => {
    useAuthStore.setState({ accessToken: "tok", user: mockUser, isAuthenticated: true });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("logout calls api, clears auth, and navigates to /login", async () => {
    useAuthStore.setState({ accessToken: "tok", user: mockUser, isAuthenticated: true });
    mockApiClient.post.mockResolvedValue();

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.logout();

    expect(mockApiClient.post).toHaveBeenCalledWith("/auth/logout");
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/login" });
  });

  it("logout still clears auth and navigates even when api call rejects", async () => {
    useAuthStore.setState({ accessToken: "tok", user: mockUser, isAuthenticated: true });
    mockApiClient.post.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // try...finally in logout: cleanup runs but error is re-thrown
    await expect(result.current.logout()).rejects.toThrow("Network error");

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/login" });
  });
});
