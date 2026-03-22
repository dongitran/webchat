import { MessageSquareDashed, MessageSquarePlus } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button.js";

function NoConversation() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center"
    >
      <div className="size-16 rounded-2xl bg-[var(--color-bg-surface)] flex items-center justify-center border border-[var(--color-border-subtle)]">
        <MessageSquareDashed size={28} className="text-[var(--color-text-muted)]" />
      </div>
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
          No conversation selected
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] max-w-xs">
          Select a conversation from the sidebar, or start a new one.
        </p>
      </div>
      <Button variant="primary" size="sm">
        <MessageSquarePlus size={14} />
        New Message
      </Button>
    </motion.div>
  );
}

function NoMessages() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center justify-center flex-1 gap-3 p-8 text-center"
    >
      <div className="size-14 rounded-2xl bg-[var(--color-bg-surface)] flex items-center justify-center border border-[var(--color-border-subtle)]">
        <MessageSquarePlus size={24} className="text-[var(--color-text-muted)]" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">No messages yet</h3>
        <p className="text-xs text-[var(--color-text-muted)]">
          Be the first to start the conversation!
        </p>
      </div>
    </motion.div>
  );
}

export { NoConversation, NoMessages };
