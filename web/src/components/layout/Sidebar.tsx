import { MessageSquare, Settings, LogOut, Search } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar.js";
import { StatusDot } from "@/components/ui/StatusDot.js";
import { Skeleton } from "@/components/ui/Skeleton.js";
import { useAuthStore } from "@/stores/auth.store.js";
import { useAuth } from "@/hooks/use-auth.js";

function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();

  return (
    <div className="flex flex-col h-full w-full bg-[var(--color-bg-elevated)]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-[var(--color-border-subtle)] shrink-0">
        <div className="size-7 rounded-lg bg-[var(--color-brand)] flex items-center justify-center shadow-[var(--shadow-glow)]">
          <MessageSquare size={14} className="text-white" />
        </div>
        <span className="font-semibold text-[var(--color-text-primary)] tracking-tight">
          WebChat
        </span>
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <button className="w-full flex items-center gap-2 h-8 px-3 rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] text-sm hover:border-[var(--color-border-default)] transition-colors">
          <Search size={13} />
          <span className="text-xs">Search conversations...</span>
          <kbd className="ml-auto text-[10px] bg-[var(--color-bg-overlay)] px-1.5 py-0.5 rounded border border-[var(--color-border-subtle)]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Conversation list placeholder */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
          Direct Messages
        </p>
        {/* Skeleton placeholders */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2.5 px-2 py-2">
            <Skeleton className="size-8 shrink-0" rounded="full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2.5 w-32" />
            </div>
          </div>
        ))}
      </div>

      {/* User profile */}
      <div className="shrink-0 border-t border-[var(--color-border-subtle)] p-3">
        {user ? (
          <div className="flex items-center gap-2.5">
            <Avatar
              src={user.avatarUrl}
              name={user.displayName}
              size="sm"
              showStatus
              status={user.status}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                {user.displayName}
              </p>
              <div className="flex items-center gap-1">
                <StatusDot status={user.status} size="sm" />
                <span className="text-[10px] text-[var(--color-text-muted)] capitalize">
                  {user.status}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                aria-label="Settings"
              >
                <Settings size={14} />
              </button>
              <button
                onClick={() => {
                  logout().catch(() => {});
                }}
                className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-bg-hover)] transition-colors"
                aria-label="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-8 shrink-0" rounded="full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2.5 w-12" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { Sidebar };
