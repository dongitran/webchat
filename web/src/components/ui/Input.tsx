import { type InputHTMLAttributes, forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils.js";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, fullWidth = false, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replaceAll(" ", "-");

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-[var(--color-text-secondary)]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "h-9 w-full rounded-[var(--radius-md)] bg-[var(--color-bg-surface)]",
              "border border-[var(--color-border-default)] text-sm text-[var(--color-text-primary)]",
              "placeholder:text-[var(--color-text-muted)]",
              "transition-colors duration-150",
              "focus:outline-none focus:border-[var(--color-brand)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              icon ? "pl-9 pr-3" : "px-3",
              error && "border-[var(--color-danger)] focus:border-[var(--color-danger)]",
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
export { Input };
export type { InputProps };
