import { cn } from "@/lib/utils.js";
import type { UserStatus } from "@webchat/shared";

interface StatusDotProps {
  status: UserStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = { sm: "size-2", md: "size-2.5", lg: "size-3" };

const statusConfig: Record<UserStatus, { color: string; pulse: boolean; label: string }> = {
  online: { color: "bg-[var(--color-online)]", pulse: true, label: "Online" },
  idle: { color: "bg-[var(--color-idle)]", pulse: false, label: "Idle" },
  dnd: { color: "bg-[var(--color-dnd)]", pulse: false, label: "Do Not Disturb" },
  offline: { color: "bg-[var(--color-offline)]", pulse: false, label: "Offline" },
};

function StatusDot({ status, size = "md", className }: StatusDotProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn("relative inline-flex shrink-0", sizeMap[size], className)}
      aria-label={config.label}
    >
      <span className={cn("size-full rounded-full", config.color)} />
      {config.pulse && (
        <span
          className={cn("absolute inset-0 rounded-full animate-ping opacity-75", config.color)}
        />
      )}
    </span>
  );
}

export { StatusDot };
