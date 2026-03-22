import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useToastStore, type Toast, type ToastVariant } from "@/stores/toast.store.js";
import { cn } from "@/lib/utils.js";

const variantConfig: Record<ToastVariant, { icon: typeof Info; color: string }> = {
  default: { icon: Info, color: "text-[var(--color-text-secondary)]" },
  success: { icon: CheckCircle2, color: "text-[var(--color-online)]" },
  error: { icon: AlertCircle, color: "text-[var(--color-danger)]" },
  warning: { icon: AlertTriangle, color: "text-[var(--color-idle)]" },
};

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const config = variantConfig[toast.variant];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "glass flex items-start gap-3 p-3 rounded-[var(--radius-lg)]",
        "shadow-[var(--shadow-md)] max-w-sm w-full",
      )}
    >
      <Icon size={16} className={cn("mt-0.5 shrink-0", config.color)} />
      <p className="flex-1 text-sm text-[var(--color-text-primary)] leading-relaxed">
        {toast.message}
      </p>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export { ToastContainer };
