import { cn } from "@/lib/utils.js";

interface SkeletonProps {
  className?: string;
  rounded?: "sm" | "md" | "full";
}

function Skeleton({ className, rounded = "md" }: SkeletonProps) {
  const radiusMap = {
    sm: "rounded-[var(--radius-sm)]",
    md: "rounded-[var(--radius-md)]",
    full: "rounded-full",
  };

  return (
    <div
      className={cn("animate-pulse bg-[var(--color-bg-hover)]", radiusMap[rounded], className)}
      aria-hidden="true"
    />
  );
}

export { Skeleton };
