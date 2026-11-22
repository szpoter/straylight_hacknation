"use client";

import { useId } from "react";
import { Button } from "@/components/ui/AppButton";
import { cn } from "@/components/ui/cn";
import type { LeaveKind } from "@/lib/rules/maternity";

/** „4 266,36 zł” — twarde spacje, bez zależności od ustawień przeglądarki. */
export function pln(value: number, withGrosz = true): string {
  const [int, dec] = (withGrosz ? value.toFixed(2) : Math.round(value).toFixed(0)).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return withGrosz ? `${grouped},${dec} zł` : `${grouped} zł`;
}

export const pct = (value: number) => `${value.toString().replace(".", ",")}%`;

const MONTHS = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
export const monthLabel = (ym: string) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;

/** Kolory okresów z tokenów DESIGN.md (secondary, tertiary, primary, on-surface). */
export const KIND_STYLE: Record<LeaveKind, { bar: string; label: string }> = {
  macierzynski: { bar: "bg-secondary", label: "macierzyński" },
  "na-warunkach": { bar: "bg-secondary", label: "na warunkach macierzyńskiego" },
  uzupelniajacy: { bar: "bg-primary", label: "uzupełniający" },
  rodzicielski: { bar: "bg-tertiary", label: "rodzicielski" },
  ojcowski: { bar: "bg-on-surface", label: "ojcowski" },
};

/** Liczba z przyciskami −/+ (tygodnie, dni). */
export function Stepper({
  label,
  hint,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: (n: number) => string;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const set = (n: number) => onChange(Math.min(max, Math.max(min, n)));
  return (
    <div className={cn("flex h-full flex-col gap-2", disabled && "opacity-60")}>
      <p id={`${id}-l`} className="text-label font-medium">
        {label}
      </p>
      {hint && (
        <p id={`${id}-h`} className="text-meta text-on-surface-variant">
          {hint}
        </p>
      )}
      <div role="group" aria-labelledby={`${id}-l`} aria-describedby={hint ? `${id}-h` : undefined} className="mt-auto flex items-center gap-3 pt-1">
        <Button variant="secondary" size="sm" className="w-10 px-0!" aria-label={`${label}: mniej`} onClick={() => set(value - step)} disabled={disabled || value <= min}>
          −
        </Button>
        <p className="min-w-24 text-center font-serif text-title" aria-live="polite">
          {unit(value)}
        </p>
        <Button variant="secondary" size="sm" className="w-10 px-0!" aria-label={`${label}: więcej`} onClick={() => set(value + step)} disabled={disabled || value >= max}>
          +
        </Button>
      </div>
    </div>
  );
}

/** Pole wyboru z etykietą i podpowiedzią (DESIGN: kolor zaznaczenia primary). */
export function Check({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (checked: boolean) => void }) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 size-5 shrink-0 accent-primary" aria-describedby={hint ? `${id}-h` : undefined} />
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        {hint && (
          <p id={`${id}-h`} className="text-meta text-on-surface-variant">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

export const weeksUnit = (n: number) => `${n} tyg.`;
export const daysUnit = (n: number) => `${n} dni`;
