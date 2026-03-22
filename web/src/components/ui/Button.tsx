import { type ButtonHTMLAttributes, forwardRef } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils.js";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-muted)] shadow-[var(--shadow-sm)] hover:glow-brand",
  secondary:
    "bg-[var(--color-bg-overlay)] text-[var(--color-text-primary)] border border-[var(--color-border-default)] hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-border-emphasis)]",
  ghost:
    "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]",
  danger: "bg-[var(--color-danger)] text-white hover:opacity-90 shadow-[var(--shadow-sm)]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-7 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-6 text-base gap-2.5",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      loading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.1 }}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-[var(--radius-md)]",
          "transition-all duration-150 cursor-pointer select-none",
          "focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] focus-visible:outline-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className,
        )}
        disabled={disabled ?? loading}
        {...(props as object)}
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {children}
      </motion.button>
    );
  },
);

Button.displayName = "Button";
export { Button };
export type { ButtonProps, ButtonVariant, ButtonSize };
