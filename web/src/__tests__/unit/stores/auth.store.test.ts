import { describe, it, expect, afterEach } from "vitest";
import type { IUser } from "@webchat/shared";
import { useAuthStore } from "@/stores/auth.store.js";

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

afterEach(() => {
  useAuthStore.setState({ accessToken: null, user: null, isAuthenticated: false });
});

describe("auth store", () => {
  it("has correct initial state", () => {
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("setAuth stores token, user, and sets isAuthenticated=true", () => {
    useAuthStore.getState().setAuth("tok-123", mockUser);
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("tok-123");
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it("clearAuth resets all fields to initial values", () => {
    useAuthStore.getState().setAuth("tok-123", mockUser);
    useAuthStore.getState().clearAuth();
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("setAuth followed by clearAuth leaves store in initial state", () => {
    useAuthStore.getState().setAuth("tok-abc", mockUser);
    useAuthStore.getState().clearAuth();
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: null,
      user: null,
      isAuthenticated: false,
    });
  });
});
