import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { useToastStore } from "@/stores/toast.store.js";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  useToastStore.setState({ toasts: [] });
});

describe("toast store", () => {
  it("has empty toasts initially", () => {
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it("addToast adds a toast with correct fields", () => {
    useToastStore.getState().addToast("Hello", "success", 3000);
    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({ message: "Hello", variant: "success", duration: 3000 });
    expect(typeof toasts[0]?.id).toBe("string");
  });

  it("addToast uses default variant 'default' and duration 4000", () => {
    useToastStore.getState().addToast("Info");
    const toast = useToastStore.getState().toasts[0];
    expect(toast?.variant).toBe("default");
    expect(toast?.duration).toBe(4000);
  });

  it("removeToast removes the toast by id", () => {
    useToastStore.getState().addToast("A");
    useToastStore.getState().addToast("B");
    const [first] = useToastStore.getState().toasts;
    useToastStore.getState().removeToast(first!.id);
    const remaining = useToastStore.getState().toasts;
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.message).toBe("B");
  });

  it("toast is auto-removed after duration elapses", () => {
    useToastStore.getState().addToast("Ephemeral", "default", 2000);
    expect(useToastStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(2001);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it("toast is not removed before duration elapses", () => {
    useToastStore.getState().addToast("Stays", "default", 5000);
    vi.advanceTimersByTime(4999);
    expect(useToastStore.getState().toasts).toHaveLength(1);
  });

  it("multiple toasts each auto-dismiss independently", () => {
    useToastStore.getState().addToast("Short", "default", 1000);
    useToastStore.getState().addToast("Long", "default", 5000);
    vi.advanceTimersByTime(1001);
    expect(useToastStore.getState().toasts).toHaveLength(1);
    expect(useToastStore.getState().toasts[0]?.message).toBe("Long");
  });
});
