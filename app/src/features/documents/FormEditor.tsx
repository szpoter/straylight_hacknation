"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button, ChoiceGroup, FieldError, SelectField, TextField, cn } from "@/components/ui";
import type { FormDef, FormField } from "@/lib/demo/forms";
import { isVisible, progress, validate, type Errors, type Values } from "./flow";

const INPUT =
  "w-full rounded-sm border border-outline bg-background px-4 py-3 text-body text-on-surface placeholder:text-on-surface-variant focus:border-on-surface focus:outline-none aria-invalid:border-2 aria-invalid:border-on-surface";

/**
 * Edycja wniosku przez rodzica: sekcje jak w druku, jedno pole pod drugim, zapis automatyczny
 * przy każdej zmianie. Błędy pokazujemy dopiero po „Zapisz i sprawdź” — z podsumowaniem na górze
 * (GOV.UK Error summary) i komunikatem przy polu.
 */
export function FormEditor({
  def,
  values,
  onChange,
  onSubmit,
  onSaveDraft,
  focusField,
  submitLabel = "Zapisz i sprawdź",
}: {
  def: FormDef;
  values: Values;
  onChange: (values: Values) => void;
  /** Wszystkie pola poprawne — przejście do sprawdzenia. */
  onSubmit: () => void;
  /** Zapis szkicu i powrót (wolno z błędami). */
  onSaveDraft: () => void;
  /** Pole, do którego przewijamy po „Zmień” na ekranie sprawdzania. */
  focusField?: string;
  submitLabel?: string;
}) {
  const [errors, setErrors] = useState<Errors>({});
  const [tried, setTried] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const { done, total } = progress(def, values);

  useEffect(() => {
    if (!focusField) return;
    const el = document.getElementById(`pole-${focusField}`);
    el?.scrollIntoView({ block: "center" });
    el?.querySelector<HTMLElement>("input, select, textarea")?.focus();
  }, [focusField]);

  const set = (id: string, value: string) => {
    const next = { ...values, [id]: value };
    onChange(next);
    // Po pierwszej próbie poprawiamy błędy na bieżąco, żeby rodzic widział, że już dobrze.
    if (tried) setErrors(validate(def, next));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(def, values);
    setErrors(found);
    setTried(true);
    if (Object.keys(found).length === 0) onSubmit();
    else requestAnimationFrame(() => summaryRef.current?.focus());
  };

  const errorList = Object.entries(errors);
  const fieldsById = Object.fromEntries(def.sections.flatMap((s) => s.fields).map((f) => [f.id, f]));

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-stack">
      <div className="flex flex-col gap-1">
        <p className="text-meta text-on-surface-variant">
          Uzupełnione {done} z {total} wymaganych pól · zapisujemy na bieżąco
        </p>
        <div className="h-1.5 overflow-hidden rounded-full bg-outline" aria-hidden>
          <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${total ? (done / total) * 100 : 100}%` }} />
        </div>
      </div>

      {errorList.length > 0 && (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="rounded-sm border-2 border-on-surface p-4 focus:outline-none">
          <p className="font-medium">Popraw {errorList.length === 1 ? "1 pole" : `${errorList.length} pól`}, żeby sprawdzić wniosek</p>
          <ul className="mt-2 flex flex-col gap-1">
            {errorList.map(([id, message]) => (
              <li key={id}>
                <a href={`#pole-${id}`} className="underline underline-offset-4 decoration-outline hover:decoration-on-surface">
                  {fieldsById[id]?.label}: {message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {def.sections.map((section) => {
        const visible = section.fields.filter((f) => isVisible(f, values));
        if (visible.length === 0) return null;
        return (
          <fieldset key={section.id} className="flex flex-col gap-6 border-t border-outline pt-6">
            <legend className="float-left mb-2 w-full font-serif text-title">{section.title}</legend>
            {visible.map((f) => (
              <div key={f.id} id={`pole-${f.id}`} className="scroll-mt-24">
                <Field field={f} value={values[f.id] ?? ""} error={errors[f.id]} onChange={(v) => set(f.id, v)} />
              </div>
            ))}
          </fieldset>
        );
      })}

      <div className="flex flex-col gap-3 border-t border-outline pt-6 sm:flex-row">
        <Button type="submit" className="justify-center">
          {submitLabel}
        </Button>
        <Button type="button" variant="secondary" className="justify-center" onClick={onSaveDraft}>
          Zapisz szkic i wróć
        </Button>
      </div>
    </form>
  );
}

function Field({ field, value, error, onChange }: { field: FormField; value: string; error?: string; onChange: (value: string) => void }) {
  const id = useId();
  const label = field.required ? field.label : `${field.label} (opcjonalnie)`;
  switch (field.type) {
    case "radio":
      return (
        <div className="flex flex-col gap-2">
          {field.hint && <p className="text-meta text-on-surface-variant">{field.hint}</p>}
          {error && <FieldError>{error}</FieldError>}
          <ChoiceGroup legend={label} choices={(field.options ?? []).map((o) => ({ value: o, label: o }))} value={value || undefined} onChange={onChange} />
        </div>
      );
    case "select":
      return (
        <div className="flex flex-col gap-1.5">
          <SelectField label={label} hint={field.hint} options={["", ...(field.options ?? [])]} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={error ? true : undefined} />
          {error && <FieldError>{error}</FieldError>}
        </div>
      );
    case "textarea":
      return (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={id} className="text-label font-medium">
            {label}
          </label>
          {field.hint && <p className="text-meta text-on-surface-variant">{field.hint}</p>}
          {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
          <textarea
            id={id}
            rows={3}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className={INPUT}
          />
        </div>
      );
    default:
      return (
        <TextField
          label={label}
          hint={field.hint}
          error={error}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type={field.type === "date" ? "date" : "text"}
          inputMode={field.type === "pesel" || field.type === "account" ? "numeric" : undefined}
          autoComplete={field.type === "account" ? "off" : undefined}
          className={cn(field.type === "pesel" && "max-w-72", field.type === "date" && "max-w-72")}
        />
      );
  }
}
