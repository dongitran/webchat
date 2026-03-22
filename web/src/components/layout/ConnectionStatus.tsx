import { AnimatePresence, motion } from "framer-motion";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { useSocketStore } from "@/stores/socket.store.js";
import { cn } from "@/lib/utils.js";

function ConnectionStatus() {
  const status = useSocketStore((s) => s.connectionStatus);
  const isVisible = status === "disconnected" || status === "reconnecting";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className={cn(
            "fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 py-2 text-sm",
            status === "reconnecting"
              ? "bg-[var(--color-idle)] text-[var(--color-text-inverse)]"
              : "bg-[var(--color-danger)] text-white",
          )}
          role="alert"
        >
          {status === "reconnecting" ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Reconnecting...
            </>
          ) : (
            <>
              <WifiOff size={14} />
              Disconnected
            </>
          )}
        </motion.div>
      )}
      {status === "connected" && (
        <motion.div
          key="connected"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.25 }}
          className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 py-2 text-sm bg-[var(--color-online)] text-white"
          role="status"
        >
          <Wifi size={14} />
          Connected
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { ConnectionStatus };
