import { cn } from "@/lib/utils.js";

type BadgeVariant = "default" | "brand" | "danger" | "success";

interface BadgeProps {
  count?: number;
  dot?: boolean;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-[var(--color-bg-overlay)] text-[var(--color-text-secondary)]",
  brand: "bg-[var(--color-brand)] text-white",
  danger: "bg-[var(--color-danger)] text-white",
  success: "bg-[var(--color-online)] text-white",
};

function Badge({ count, dot = false, variant = "danger", className }: BadgeProps) {
  if (dot) {
    return (
      <span
        className={cn("inline-block size-2 rounded-full", variantStyles[variant], className)}
        aria-hidden="true"
      />
    );
  }

  if (count === undefined || count <= 0) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-[18px] h-[18px]",
        "rounded-full text-[10px] font-bold px-1",
        variantStyles[variant],
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export { Badge };
export type { BadgeProps };
