"use client";

import { useId, type ComponentProps } from "react";
import { cn } from "./cn";

const INPUT =
  "h-12 md:h-14 w-full rounded-sm border border-outline bg-surface px-4 text-body text-on-surface placeholder:text-on-surface-variant focus:border-on-surface focus:outline-none aria-invalid:border-2 aria-invalid:border-on-surface";

/** Pole formularza z widoczną etykietą, podpowiedzią i błędem przy polu. */
export function TextField({
  label,
  hint,
  error,
  className,
  ...rest
}: { label: string; hint?: string; error?: string } & ComponentProps<"input">) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-label font-medium">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-meta text-on-surface-variant">
          {hint}
        </p>
      )}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
      <input
        id={id}
        aria-describedby={[hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined}
        aria-invalid={error ? true : undefined}
        className={INPUT}
        {...rest}
      />
    </div>
  );
}

/** Lista rozwijana z widoczną etykietą (dla odpowiedzi z zamkniętej listy). */
export function SelectField({
  label,
  hint,
  options,
  className,
  ...rest
}: { label: string; hint?: string; options: string[] } & ComponentProps<"select">) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-label font-medium">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-meta text-on-surface-variant">
          {hint}
        </p>
      )}
      <div className="relative">
        <select id={id} aria-describedby={hint ? `${id}-hint` : undefined} className={cn(INPUT, "appearance-none pr-12")} {...rest}>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 fill-none stroke-on-surface" strokeWidth={1.75}>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

export function FieldError({ id, children }: { id?: string; children: React.ReactNode }) {
  // Kolor błędu nie ma tokenu — tusz z akcentem bursztynowym, do weryfikacji.
  return (
    <p id={id} className="inline-flex w-fit items-center gap-1.5 rounded-sm bg-tertiary px-2 py-0.5 text-meta font-medium text-on-surface" role="alert">
      {children}
    </p>
  );
}

export type DateParts = { day: string; month: string; year: string };

/** Data w trzech polach z klawiaturą numeryczną (GOV.UK Date input). */
export function DateField({
  legend,
  hint,
  value,
  onChange,
  error,
}: {
  legend: string;
  hint?: string;
  value: DateParts;
  onChange: (value: DateParts) => void;
  error?: string;
}) {
  const id = useId();
  const part = (key: keyof DateParts, label: string, width: string, max: number) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`${id}-${key}`} className="text-meta font-medium">
        {label}
      </label>
      <input
        id={`${id}-${key}`}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        maxLength={max}
        value={value[key]}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange({ ...value, [key]: e.target.value.replace(/\D/g, "") })}
        className={cn(INPUT, width)}
      />
    </div>
  );
  return (
    <fieldset aria-describedby={[hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined}>
      <legend className="sr-only">{legend}</legend>
      {hint && (
        <p id={`${id}-hint`} className="mb-3 text-meta text-on-surface-variant">
          {hint}
        </p>
      )}
      {error && (
        <div className="mb-3">
          <FieldError id={`${id}-error`}>{error}</FieldError>
        </div>
      )}
      <div className="flex gap-3">
        {part("day", "Dzień", "w-16 md:w-20", 2)}
        {part("month", "Miesiąc", "w-16 md:w-20", 2)}
        {part("year", "Rok", "w-24 md:w-28", 4)}
      </div>
    </fieldset>
  );
}

/** Zwraca ISO albo komunikat błędu (np. 31.02). */
export function parseDateParts({ day, month, year }: DateParts): { iso?: string; error?: string } {
  if (!day && !month && !year) return { error: "Wpisz datę albo wybierz „Uzupełnię później”" };
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!day || !month || year.length !== 4) return { error: "Wpisz dzień, miesiąc i rok, np. 10 11 2026" };
  const date = new Date(Date.UTC(y, m - 1, d));
  if (m < 1 || m > 12 || date.getUTCDate() !== d || date.getUTCMonth() !== m - 1) return { error: "Taki dzień nie istnieje. Sprawdź dzień i miesiąc" };
  return { iso: date.toISOString().slice(0, 10) };
}
