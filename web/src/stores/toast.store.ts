import { create } from "zustand";
import { randomUUID } from "@/lib/utils.js";

export type ToastVariant = "default" | "success" | "error" | "warning";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, variant?: ToastVariant, duration?: number) => void;
  removeToast: (id: string) => void;
}

function scheduleRemoval(id: string, duration: number, removeToast: (id: string) => void): void {
  setTimeout(() => removeToast(id), duration);
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: (message, variant = "default", duration = 4000) => {
    const id = randomUUID();
    set((state) => ({ toasts: [...state.toasts, { id, message, variant, duration }] }));
    scheduleRemoval(id, duration, get().removeToast);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
