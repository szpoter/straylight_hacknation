"use client";

import { cn } from "./cn";

/** Przełącznik-pigułka (np. „Wariant A / Wariant B”, sposób wypłaty). */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex w-fit max-w-full flex-wrap gap-1 rounded-full border border-outline bg-background p-1", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "min-h-10 rounded-full px-4 text-meta font-medium transition-colors duration-150",
              active ? "bg-on-surface text-on-primary" : "text-on-surface hover:bg-surface",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
