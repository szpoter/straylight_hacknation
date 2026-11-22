"use client";

import { cn } from "./cn";

/** Zakładki-pigułki z opcjonalnym licznikiem (np. „Sprawy / Pliki dziecka”, filtry statusu). */
export function PillTabs<T extends string>({
  label,
  items,
  value,
  onChange,
  className,
  scroll,
}: {
  label: string;
  items: Array<{ value: T; label: string; count?: number }>;
  value: T | undefined;
  onChange: (value: T) => void;
  className?: string;
  /** Na telefonie przewijane w poziomie wewnątrz paska. */
  scroll?: boolean;
}) {
  return (
    <div role="tablist" aria-label={label} className={cn("flex gap-2", scroll ? "-mx-gutter-mobile overflow-x-auto px-gutter-mobile md:mx-0 md:px-0" : "flex-wrap", className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-meta font-medium transition-colors duration-150",
              active ? "border-on-surface bg-on-surface text-on-primary" : "border-outline bg-background text-on-surface hover:border-on-surface",
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className={cn("rounded-full px-1.5 text-meta", active ? "bg-background text-on-surface" : "bg-surface")}>{item.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
