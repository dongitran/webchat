import { create } from "zustand";

type ModalType = "createConversation" | "editProfile" | "confirmLeave" | null;

interface UIState {
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  activeModal: ModalType;
  setSidebarOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  openModal: (modal: NonNullable<ModalType>) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  rightPanelOpen: false,
  activeModal: null,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
}));
