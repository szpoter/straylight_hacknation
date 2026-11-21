import { formatLong } from "@/lib/demo/dates";
import { PARENT_PROFILE } from "@/lib/demo/fixtures";
import type { ProfileRow } from "@/lib/demo/types";
import { CHILD_COUNTS, JOB_CHANGE, LATER, ROLES, SITUATIONS, type Answers, type StepId } from "./flow";

export type SummaryRow = ProfileRow & { step?: StepId };

function dateValue(value: string | undefined): string {
  if (!value || value === LATER) return "Uzupełnię później";
  return formatLong(value);
}

/** Podsumowanie: dane urzędowe (kłódka) i odpowiedzi rodzica („Zmień” wraca do pytania). */
export function summaryRows(answers: Answers): SummaryRow[] {
  const official: SummaryRow[] = PARENT_PROFILE.filter((r) => !r.editable);
  const own: SummaryRow[] = [];
  const add = (label: string, value: string, step: StepId) => own.push({ label, value, source: "rodzic", editable: true, step });
  const s = answers.situation;
  if (s) add("Dla kogo plan", SITUATIONS.find((x) => x.value === s)!.label, "situation");
  if (s && answers.role) add("Rola w planie", ROLES[s].find((r) => r.value === answers.role)?.label ?? "—", "role");
  if (s === "ciaza") add("Planowany termin porodu", dateValue(answers.dueDate), "dueDate");
  if (s === "urodzone") add("Data urodzenia dziecka", dateValue(answers.birthDate), "birthDate");
  if (s === "adopcja" || s === "piecza") {
    add("Data przyjęcia pod opiekę", dateValue(answers.careDate), "careDate");
    add("Data urodzenia dziecka", dateValue(answers.childBirthDate), "childBirthDate");
  }
  if (answers.childCount) add("Liczba dzieci", CHILD_COUNTS.find((c) => c.value === answers.childCount)!.label, "childCount");
  add("Nazwa planu", answers.planName ?? "Moje dziecko", "planName");
  add(
    "Zmiana pracy przed porodem",
    answers.jobChange && answers.jobChange !== "pominieto" ? JOB_CHANGE.find((j) => j.value === answers.jobChange)!.label : "Brak danych",
    "jobChange",
  );
  return [...official, ...own];
}
