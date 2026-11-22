import type { Stop } from "@/lib/demo/types";
import { formatLong } from "@/lib/demo/dates";
import { HANDOFF_RECORDED, docStatus, type DocGroup } from "@/lib/plan/status";

export type DocCase = Stop & { doc: NonNullable<Stop["doc"]>; state: NonNullable<Stop["state"]> };

export type RowAction = { label: string; kind: "zusik" | "link"; /** Krok wniosku w adresie sprawy (`?krok=`). */ step?: "wniosek" | "sprawdz" | "przekaz" };

/**
 * Jedno działanie w wierszu sprawy, zależne od stanu (tabela grup w SPEC-PO-LOGOWANIU).
 * Wniosek rodzic wypełnia sam (krok „wniosek”); Zusik pomaga z poziomu szczegółów sprawy.
 */
export function rowAction(c: DocCase): RowAction {
  if (c.state === "wezwanie") return { label: "Otwórz wezwanie", kind: "link" };
  switch (c.state) {
    case "aktualna":
      return { label: "Rozpocznij", kind: "link", step: "wniosek" };
    case "szkic":
      return { label: "Uzupełnij wniosek", kind: "link", step: "wniosek" };
    case "wypelniony":
      return { label: "Sprawdź i zatwierdź", kind: "link", step: "sprawdz" };
    case "zatwierdzony":
      return { label: "Oznacz przekazanie", kind: "link", step: "przekaz" };
    case "wyslano":
      return { label: "Zobacz przebieg", kind: "link" };
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
  if (c.doc.lastEvent) {
    const earlierHandoff = c.doc.events?.some(e => e.title === "Wysłano w symulacji")
      && /^(Potwierdzono wpływ|Przekazano|Wysłano)/.test(c.doc.lastEvent);
    parts.push(earlierHandoff ? "Wcześniejszy wpis o przekazaniu" : c.doc.lastEvent);
  } else if (c.doc.note) parts.push(c.doc.note);
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
      if (e.title === HANDOFF_RECORDED) files.push({ ...base, id: `${c.id}-kopia`, name: `Kopia: ${c.title}`, type: "Kopia wniosku" });
      if (e.title === "Otrzymano wezwanie") files.push({ ...base, id: `${c.id}-pismo`, name: `Pismo z ${e.author ?? "urzędu"}: wezwanie do uzupełnienia`, type: "Pismo przychodzące" });
    }
  }
  return files.sort((a, b) => b.date.localeCompare(a.date));
}
