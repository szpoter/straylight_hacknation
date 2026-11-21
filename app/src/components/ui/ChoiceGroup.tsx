"use client";

import { useId } from "react";
import { cn } from "./cn";
import { CheckIcon } from "./icons";

export type Choice = { value: string; label: string; hint?: string };

/**
 * Karty wyboru jako grupa radio (strzałki, spacja). Zaznaczenie to ptaszek, obramowanie i tło,
 * nie sam kolor (ui/MACIEJ.md, „Wybór”).
 */
export function ChoiceGroup({
  legend,
  legendHidden,
  choices,
  value,
  onChange,
  columns = 2,
  name,
}: {
  legend: string;
  legendHidden?: boolean;
  choices: Choice[];
  value: string | undefined;
  onChange: (value: string) => void;
  columns?: 2 | 3;
  name?: string;
}) {
  const autoName = useId();
  return (
    <fieldset>
      <legend className={cn(legendHidden ? "sr-only" : "mb-3 text-label font-medium")}>{legend}</legend>
      <div className={cn("grid grid-cols-1 gap-3", columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2")}>
        {choices.map((choice) => {
          const checked = value === choice.value;
          return (
            <label
              key={choice.value}
              className={cn(
                "relative flex min-h-16 cursor-pointer items-center gap-3 rounded-lg border bg-surface px-5 py-4 transition-colors duration-150",
                "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-on-surface",
                checked ? "border-2 border-primary bg-background" : "border-outline hover:border-on-surface-variant",
              )}
            >
              <input
                type="radio"
                name={name ?? autoName}
                value={choice.value}
                checked={checked}
                onChange={() => onChange(choice.value)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border",
                  checked ? "border-primary bg-primary text-on-primary" : "border-outline bg-surface",
                )}
              >
                {checked && <CheckIcon size={16} strokeWidth={2.5} />}
              </span>
              <span className="flex flex-col">
                <span className="text-label font-medium">{choice.label}</span>
                {choice.hint && <span className="text-meta text-on-surface-variant">{choice.hint}</span>}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
