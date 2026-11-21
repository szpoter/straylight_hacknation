import type { Stop } from "@/lib/demo/types";
import { formatLong } from "@/lib/demo/dates";
import { docStatus, type DocGroup } from "@/lib/plan/status";

export type DocCase = Stop & { doc: NonNullable<Stop["doc"]>; state: NonNullable<Stop["state"]> };

export type RowAction = { label: string; kind: "zusik" | "link" };

/** Jedno działanie w wierszu sprawy, zależne od stanu (tabela grup w SPEC-PO-LOGOWANIU). */
export function rowAction(c: DocCase): RowAction {
  if (c.state === "wezwanie") return { label: "Otwórz wezwanie", kind: "link" };
  if (c.doc.hasDraft && (c.state === "szkic" || c.state === "aktualna")) return { label: "Dokończ z Zusikiem", kind: "zusik" };
  switch (c.state) {
    case "aktualna":
      return { label: "Rozpocznij", kind: "link" };
    case "szkic":
    case "wypelniony":
      return { label: "Sprawdź i zatwierdź", kind: "link" };
    case "zatwierdzony":
      return { label: "Przekaż", kind: "link" };
    case "wyslano":
      return { label: "Zobacz przebieg sprawy", kind: "link" };
    case "warunek":
      return { label: "Zobacz, co przygotować", kind: "link" };
    default:
      return { label: "Zobacz wynik", kind: "link" };
  }
}

/** Drugi wiersz: termin, ostatnie zdarzenie, notatka albo warunek. */
export function rowDetail(c: DocCase): string | undefined {
  if (c.state === "wezwanie" && c.doc.summons) return `Termin do ${formatLong(c.doc.summons.due)}`;
  if (c.state === "warunek") return c.condition ?? c.doc.note;
  const parts: string[] = [];
  if (c.due && docStatus(c.state).group === "do-zalatwienia") parts.push(`Do ${formatLong(c.due)}`);
  if (c.doc.result) parts.push(c.doc.result);
  if (c.doc.lastEvent) parts.push(c.doc.lastEvent);
  else if (c.doc.note) parts.push(c.doc.note);
  return parts.join(" · ") || undefined;
}

/** Wezwania na górze, potem według terminu. */
export function sortCases(cases: DocCase[]): DocCase[] {
  return [...cases].sort((a, b) => {
    const aw = a.state === "wezwanie" ? 0 : 1;
    const bw = b.state === "wezwanie" ? 0 : 1;
    if (aw !== bw) return aw - bw;
    return (a.due ?? "9999").localeCompare(b.due ?? "9999");
  });
}

export const GROUP_TONE: Record<DocGroup, "accent" | "brand" | "neutral"> = {
  "do-zalatwienia": "accent",
  wyslane: "brand",
  "na-pozniej": "neutral",
  zakonczone: "neutral",
};

export type ChildFile = { id: string; name: string; type: string; date: string; caseId: string; caseTitle: string; goal: DocCase["doc"]["goal"] };

/** „Pliki dziecka” wyprowadzone ze zdarzeń spraw. TODO(backend): pliki z magazynu sprawy. */
export function childFiles(cases: DocCase[]): ChildFile[] {
  const files: ChildFile[] = [];
  for (const c of cases) {
    for (const e of c.doc.events ?? []) {
      const base = { caseId: c.id, caseTitle: c.title, goal: c.doc.goal, date: e.date };
      if (e.title === "Wysłano w symulacji") files.push({ ...base, id: `${c.id}-kopia`, name: `Kopia: ${c.title}`, type: "Kopia wniosku" });
      if (e.title === "Potwierdzenie wpływu") files.push({ ...base, id: `${c.id}-upp`, name: `Potwierdzenie UPP: ${c.title}`, type: "Potwierdzenie" });
      if (e.title === "Otrzymano wezwanie") files.push({ ...base, id: `${c.id}-pismo`, name: `Pismo z ${e.author ?? "urzędu"}: wezwanie do uzupełnienia`, type: "Pismo przychodzące" });
    }
  }
  return files.sort((a, b) => b.date.localeCompare(a.date));
}
