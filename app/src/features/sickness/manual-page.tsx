"use client";

import { documentLabel, findingLabel, type ManualFields } from "@/lib/sickness/manual";

const facts = {
  certificate: ["incapacity"],
  employment: ["covered", "excluded"],
  history: ["ended", "never"],
} as Record<string, string[]>;

export function ManualPage({
  fields,
  onChange,
}: {
  fields: ManualFields;
  onChange: (fields: ManualFields) => void;
}) {
  const edit = (key: keyof ManualFields, value: string) =>
    onChange({ ...fields, [key]: value, ...(key === "kind" ? { value: "" } : {}) });
  function select(key: keyof ManualFields, label: string, options: Record<string, string>) {
    return (
      <label>
        {label}{" "}
        <select aria-label={label} value={fields[key]} onChange={(e) => edit(key, e.target.value)}>
          <option value="">Wybierz po sprawdzeniu strony</option>
          {Object.entries(options).map(([v, t]) => (
            <option key={v} value={v}>
              {t}
            </option>
          ))}
        </select>
      </label>
    );
  }
  const date = (key: "from" | "to" | "onset", label: string) => (
    <label>
      {label} <input type="date" value={fields[key]} onChange={(e) => edit(key, e.target.value)} />
    </label>
  );
  return (
    <fieldset style={{ display: "grid", gap: 8 }}>
      <legend>Fakty potwierdzane na tej stronie</legend>
      {select("kind", "Rodzaj dokumentu", documentLabel)}
      {select("subject", "Osoba", { "DEMO-A": "Wnioskodawczyni tej sprawy", "DEMO-B": "Inna osoba" })}
      {select("payer", "Płatnik", {
        A: "Pracodawca A z profilu",
        B: "Inny płatnik",
        wszystkie: "Pełna historia wszystkich płatników",
      })}
      {select("title", "Tytuł", {
        pracownik: "Pracownik",
        działalność: "Działalność",
        wszystkie: "Wszystkie tytuły",
      })}
      {date("from", "Pierwszy dzień okresu wskazanego w dokumencie")}
      {date("to", "Ostatni dzień okresu wskazanego w dokumencie")}
      {fields.kind === "certificate" && date("onset", "Początek ciągłej niezdolności (jeśli ustalony)")}
      {fields.kind &&
        select(
          "value",
          "Co dokładnie ustalono",
          Object.fromEntries((facts[fields.kind] ?? []).map((v) => [v, findingLabel[v]])),
        )}
    </fieldset>
  );
}
