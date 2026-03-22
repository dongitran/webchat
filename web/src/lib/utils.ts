/** Browser-compatible UUID generator */
export function randomUUID(): string {
  return crypto.randomUUID();
}

/** Merge class names, filtering falsy values */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
