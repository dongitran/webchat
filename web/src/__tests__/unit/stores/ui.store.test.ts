import { describe, it, expect, afterEach } from "vitest";
import { useUIStore } from "@/stores/ui.store.js";

afterEach(() => {
  useUIStore.setState({
    sidebarOpen: true,
    rightPanelOpen: false,
    activeModal: null,
  });
});

describe("ui store", () => {
  it("has correct initial state", () => {
    const state = useUIStore.getState();
    expect(state.sidebarOpen).toBe(true);
    expect(state.rightPanelOpen).toBe(false);
    expect(state.activeModal).toBeNull();
  });

  it("setSidebarOpen updates sidebarOpen", () => {
    useUIStore.getState().setSidebarOpen(false);
    expect(useUIStore.getState().sidebarOpen).toBe(false);
    useUIStore.getState().setSidebarOpen(true);
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it("setRightPanelOpen updates rightPanelOpen", () => {
    useUIStore.getState().setRightPanelOpen(true);
    expect(useUIStore.getState().rightPanelOpen).toBe(true);
  });

  it("openModal sets activeModal", () => {
    useUIStore.getState().openModal("editProfile");
    expect(useUIStore.getState().activeModal).toBe("editProfile");
  });

  it("closeModal resets activeModal to null", () => {
    useUIStore.getState().openModal("createConversation");
    useUIStore.getState().closeModal();
    expect(useUIStore.getState().activeModal).toBeNull();
  });

  it("openModal can switch between modals", () => {
    useUIStore.getState().openModal("editProfile");
    useUIStore.getState().openModal("confirmLeave");
    expect(useUIStore.getState().activeModal).toBe("confirmLeave");
  });
});
