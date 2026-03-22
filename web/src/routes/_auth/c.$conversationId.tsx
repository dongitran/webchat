import { createFileRoute } from "@tanstack/react-router";
import { NoMessages } from "@/components/layout/EmptyStates.js";

export const Route = createFileRoute("/_auth/c/$conversationId")({
  component: ConversationPage,
});

function ConversationPage() {
  const { conversationId } = Route.useParams();
  // Full implementation in Phase 5 (Socket.IO + message list)
  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-[var(--color-border-subtle)] flex items-center px-4 bg-[var(--color-bg-elevated)] shrink-0">
        <h1 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
          Conversation
        </h1>
        <span className="ml-2 text-xs text-[var(--color-text-muted)] font-mono">
          #{conversationId.slice(0, 8)}
        </span>
      </div>
      <NoMessages />
    </div>
  );
}
