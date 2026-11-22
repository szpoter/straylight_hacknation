"use client";

import { cn } from "./cn";

/** Przełącznik-pigułka (np. „Wariant A / Wariant B”, sposób wypłaty). */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
  fill = false,
}: {
  label: string;
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
  /** Na całą szerokość, opcje równej szerokości. */
  fill?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn(
        "max-w-full gap-1 rounded-full border border-outline bg-background p-1",
        fill ? "flex w-full flex-wrap sm:inline-flex sm:w-fit" : "inline-flex w-fit flex-wrap",
        className,
      )}>
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
              fill && "min-w-0 flex-auto px-3 leading-tight sm:flex-none sm:px-4",
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
