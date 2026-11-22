/**
 * Przebieg wniosku w „Dokumentach”: wartości pól, walidacja i przejścia stanów
 * (aktualna → szkic/wypełniony → zatwierdzony → wysłano → korekta). Czyste funkcje — testy w
 * tests/documents-flow.test.ts. Przekazanie potwierdza rodzic.
 */
import { isValidIso } from "@/lib/rules/dates";
import { OLA } from "@/lib/family/ola";
import { HANDOFF_RECORDED, IN_PERSON_COMPLETED, SIMULATED_HANDOFF } from "@/lib/plan/status";
import { CHANNEL_LABEL, type Channel, type FormDef, type FormField, type PrefillContext } from "@/lib/demo/form-fields";
import { formatLong, todayInPoland } from "@/lib/demo/dates";
import type { CaseEvent, CaseState } from "@/lib/demo/types";

export type Values = Record<string, string>;
export type Errors = Record<string, string>;

export function demoProfile(): { parentName: string; employer: string } {
  return { parentName: OLA.mother, employer: OLA.employer };
}

/** Keep the original autosaved draft intact when updating the former Ola profile. */
export function documentDraft(planId: string, stopId: string, read: (id: string) => Values) {
  const original = read(stopId);
  const customParent = original.rodzic && !["Anna Przykładowa", OLA.mother, OLA.father].includes(original.rodzic);
  const previous = planId === "ola" && !customParent && (
    original.rodzic === "Anna Przykładowa" || original.pracodawca === "Kwiatek sp. z o.o." || original.dziecko === "Ola"
  );
  if (!previous) return { key: stopId, values: original };
  const key = `${stopId}:ola-lis`;
  const updated = read(key);
  if (Object.keys(updated).length) return { key, values: updated };

  const values = { ...original };
  if (values.rodzic === "Anna Przykładowa" && stopId !== "urlop-ojcowski") {
    values.rodzic = OLA.mother;
    for (const field of ["rodzic_pesel", "rachunek", "adres"]) delete values[field];
  }
  if (values.pracodawca === "Kwiatek sp. z o.o." && values.rodzic === OLA.mother) values.pracodawca = OLA.employer;
  if (values.dziecko === "Ola") {
    values.dziecko = OLA.child;
    delete values.dziecko_pesel;
  }
  return { key, values };
}

export function allFields(def: FormDef): FormField[] {
  return def.sections.flatMap((s) => s.fields);
}

/** Wartości startowe: najpierw zapisane przez rodzica, w pustych miejscach podstawione z planu. */
export function initialValues(def: FormDef, ctx: PrefillContext, saved: Values = {}): Values {
  // Starsze szkice trzymały imię i nazwisko razem, także gdy nowy druk ma osobne rubryki.
  const draftContext = { ...ctx, parentName: saved.rodzic?.trim() || ctx.parentName, childName: saved.dziecko?.trim() || ctx.childName };
  const values: Values = {};
  for (const f of allFields(def)) {
    const prefilled = f.prefill?.(draftContext);
    if (prefilled) values[f.id] = prefilled;
  }
  return { ...values, ...saved };
}

export function isVisible(field: FormField, values: Values): boolean {
  return !field.showIf || values[field.showIf.field] === field.showIf.equals;
}

/** Numer wpisany w grupach („900512 12349”, „900512-12349”) → same cyfry. */
export function compactDigits(value: string): string {
  return value.replace(/[\s-]+/g, "");
}

/** PESEL: 11 cyfr i poprawna cyfra kontrolna. Spacje i myślniki między cyframi są dozwolone. */
export function validPesel(raw: string): boolean {
  const value = compactDigits(raw);
  if (!/^\d{11}$/.test(value)) return false;
  const w = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  const sum = w.reduce((acc, weight, i) => acc + weight * Number(value[i]), 0);
  return (10 - (sum % 10)) % 10 === Number(value[10]);
}

/** Komunikat przy PESEL-u mówi, co dokładnie jest nie tak: znaki, liczba cyfr albo cyfra kontrolna. */
export function peselError(raw: string): string | undefined {
  const value = compactDigits(raw);
  if (!/^\d+$/.test(value)) return "PESEL składa się tylko z cyfr";
  if (value.length !== 11) return `PESEL ma 11 cyfr, a wpisano ${value.length}`;
  if (!validPesel(value)) return "Ostatnia cyfra PESEL-u (kontrolna) nie zgadza się z pozostałymi. Sprawdź, czy nie ma literówki";
  return undefined;
}

/** Numer rachunku: 26 cyfr (spacje, myślniki i „PL” na początku dozwolone). */
export function normalizeAccount(value: string): string {
  return compactDigits(value).replace(/^PL/i, "");
}

function accountError(raw: string): string | undefined {
  const value = normalizeAccount(raw);
  if (!/^\d+$/.test(value)) return "Numer rachunku składa się z cyfr. Możesz je oddzielić spacjami";
  if (value.length !== 26) return `Numer rachunku ma 26 cyfr, a wpisano ${value.length}`;
  return undefined;
}

export function validateField(field: FormField, raw: string | undefined): string | undefined {
  const value = (raw ?? "").trim();
  if (!value) return field.required ? (field.type === "radio" || field.type === "select" ? "Wybierz jedną odpowiedź" : `Uzupełnij pole „${field.label}”`) : undefined;
  switch (field.type) {
    case "pesel":
      return peselError(value);
    case "account":
      return accountError(value);
    case "date":
      return isValidIso(value) ? undefined : "Wpisz datę, np. 10.11.2026";
    case "select":
    case "radio":
      return field.options && !field.options.includes(value) ? "Wybierz jedną z odpowiedzi" : undefined;
    default:
      return undefined;
  }
}

/** Błędy widocznych pól (ukryte przez `showIf` nie blokują wniosku). */
export function validate(def: FormDef, values: Values, today = todayInPoland()): Errors {
  const errors = { ...def.validate?.(values, today) };
  for (const f of allFields(def)) {
    if (!isVisible(f, values)) continue;
    const error = validateField(f, values[f.id]);
    if (error) errors[f.id] = error;
  }
  return errors;
}

/** Ile wymaganych pól jest już poprawnie uzupełnionych. */
export function progress(def: FormDef, values: Values): { done: number; total: number } {
  const required = allFields(def).filter((f) => f.required && isVisible(f, values));
  const errors = validate(def, values);
  return { done: required.filter((f) => !errors[f.id]).length, total: required.length };
}

/** Wartość do ekranu „Sprawdź odpowiedzi”. */
export function displayValue(field: FormField, value: string | undefined): string {
  if (!value) return "—";
  if (field.type === "date" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return formatLong(value);
  if (field.type === "pesel") return compactDigits(value);
  if (field.type === "account") return normalizeAccount(value).replace(/(\d{2})(\d{4})(\d{4})(\d{4})(\d{4})(\d{4})(\d{4})/, "$1 $2 $3 $4 $5 $6 $7");
  return value;
}

export type FlowAction = "save" | "approve" | "send" | "correct";

/**
 * Stan sprawy po działaniu rodzica. Zapis bez kompletu poprawnych pól to „szkic”, z kompletem —
 * „wypełniony”. Zatwierdzić można tylko kompletny wniosek, przekazać — tylko zatwierdzony.
 * Korekta wysłanego wniosku zaczyna nowy szkic z poprzednich wartości.
 */
export function nextState(current: CaseState, action: FlowAction, valid: boolean): CaseState {
  switch (action) {
    case "save":
      return valid ? "wypelniony" : "szkic";
    case "approve":
      return valid ? "zatwierdzony" : current;
    case "send":
      return current === "zatwierdzony" ? "wyslano" : current;
    case "correct":
      return current === "wyslano" || current === "zatwierdzony" ? "szkic" : current;
  }
}

/** Czy w tym stanie rodzic może edytować pola wniosku. */
export function canEdit(state: CaseState): boolean {
  return state === "aktualna" || state === "szkic" || state === "wypelniony" || state === "zatwierdzony" || state === "wezwanie";
}

/** Każde przekazanie i korekta mają osobny wpis w historii. */
export function sendEvents(existing: CaseEvent[] = [], channel: Channel, recipient: string, today: string, correction = false): CaseEvent[] {
  const delivery = CHANNEL_LABEL[channel];
  const detail = `${correction ? "Korekta wniosku" : "Wniosek"} · ${recipient} · ${delivery.label}.`;
  if (delivery.mode === "online") {
    return [...existing, { date: today, title: SIMULATED_HANDOFF, author: "Demo", detail: `${detail} Przykładowe potwierdzenie: ${delivery.receipt}.`, simulatedReceipt: delivery.receipt }];
  }
  return [...existing, {
    date: today, title: delivery.mode === "osobiscie" ? IN_PERSON_COMPLETED : HANDOFF_RECORDED,
    author: "Ty", detail,
  }];
}
