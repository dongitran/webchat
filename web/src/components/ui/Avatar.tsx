import { type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils.js";
import type { UserStatus } from "@webchat/shared";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  status?: UserStatus;
  showStatus?: boolean;
}

const sizeStyles: Record<AvatarSize, { container: string; text: string; dot: string }> = {
  xs: { container: "size-6 text-[9px]", text: "font-semibold", dot: "size-2 border" },
  sm: { container: "size-8 text-xs", text: "font-semibold", dot: "size-2.5 border" },
  md: { container: "size-9 text-sm", text: "font-semibold", dot: "size-3 border-2" },
  lg: { container: "size-12 text-base", text: "font-bold", dot: "size-3.5 border-2" },
  xl: { container: "size-16 text-xl", text: "font-bold", dot: "size-4 border-2" },
};

const statusColors: Record<UserStatus, string> = {
  online: "bg-[var(--color-online)]",
  idle: "bg-[var(--color-idle)]",
  dnd: "bg-[var(--color-dnd)]",
  offline: "bg-[var(--color-offline)]",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => [...n][0] ?? "")
    .join("")
    .toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    "from-violet-500 to-indigo-600",
    "from-sky-500 to-blue-600",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-fuchsia-500 to-purple-600",
  ];
  const index = [...name].reduce((acc, char) => acc + char.codePointAt(0)!, 0) % colors.length;
  return colors[index] ?? colors[0]!;
}

function Avatar({
  src,
  name,
  size = "md",
  status,
  showStatus = false,
  className,
  ...props
}: AvatarProps) {
  const sizes = sizeStyles[size];

  return (
    <div className={cn("relative inline-flex shrink-0", sizes.container, className)}>
      {src ? (
        <img src={src} alt={name} className="size-full rounded-full object-cover" {...props} />
      ) : (
        <div
          className={cn(
            "size-full rounded-full bg-gradient-to-br flex items-center justify-center",
            "text-white",
            sizes.text,
            getAvatarColor(name),
          )}
          aria-label={name}
        >
          {getInitials(name)}
        </div>
      )}
      {showStatus && status && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 rounded-full border-[var(--color-bg-base)]",
            sizes.dot,
            statusColors[status],
          )}
          aria-label={status}
        />
      )}
    </div>
  );
}

export { Avatar };
export type { AvatarProps, AvatarSize };
