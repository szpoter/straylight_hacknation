import { formatLong } from "@/lib/demo/dates";
import { PARENT_PROFILE } from "@/lib/demo/fixtures";
import type { ProfileRow } from "@/lib/demo/types";
import { JOB_CHANGE, ROLES, SITUATIONS, childCountChoices, childTotal, employmentChoices, joinNames, type Answers, type DateKey, type StepId } from "./flow";

export type SummaryRow = ProfileRow & { step?: StepId };

/** Dane z logowania i ZUS (z kłódką) — bez odpowiedzi z onboardingu, które rodzic poda sam. */
export const OFFICIAL_ROWS: ProfileRow[] = PARENT_PROFILE.filter((r) => !r.editable);

function dateValue(answers: Answers, key: DateKey): string {
  const value = answers[key];
  if (!value) return "Bez daty — przybliżymy";
  return answers.estimated?.[key] ? `ok. ${formatLong(value)}` : formatLong(value);
}

/** Odpowiedzi rodzica na ekranie gotowego planu („Zmień” wraca do pytania). */
export function summaryRows(answers: Answers): SummaryRow[] {
  const rows: SummaryRow[] = [];
  const add = (label: string, value: string, step: StepId) => rows.push({ label, value, source: "rodzic", editable: true, step });
  const s = answers.situation;
  if (!s) return rows;
  add("Etap", SITUATIONS.find((x) => x.value === s)!.label, "situation");
  if (answers.role) add("Rola w planie", ROLES[s].find((r) => r.value === answers.role)?.label ?? "—", "role");
  if (s === "ciaza") add("Termin porodu", dateValue(answers, "dueDate"), "dueDate");
  if (s === "urodzone") add(childTotal(answers) > 1 ? "Data urodzenia dzieci" : "Data urodzenia", dateValue(answers, "birthDate"), "birthDate");
  if (s === "adopcja" || s === "piecza") add("Przyjęcie pod opiekę", dateValue(answers, "careDate"), "careDate");
  if (answers.childCount) add("Liczba dzieci", childCountChoices(s).find((c) => c.value === answers.childCount)!.label, "childCount");
  if (s === "adopcja" || s === "piecza") add("Urodzenie dziecka", dateValue(answers, "childBirthDate"), "childBirthDate");
  if (s === "ciaza") add("Podpis planu", answers.planName?.trim() || "Bez podpisu", "planName");
  if (s === "urodzone" || s === "adopcja" || s === "piecza") {
    const names = (answers.names ?? []).map((n) => n.trim()).filter(Boolean);
    add(childTotal(answers) > 1 ? "Imiona" : "Imię", names.length ? joinNames(names) : "Bez imienia", "names");
  }
  if (answers.employment) add("Praca", employmentChoices(answers).find((e) => e.value === answers.employment)!.label, "employment");
  if (answers.jobChange && answers.jobChange !== "pominieto") add("Zmiana pracy", JOB_CHANGE.find((j) => j.value === answers.jobChange)!.label, "jobChange");
  return rows;
}
