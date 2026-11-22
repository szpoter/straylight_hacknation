import type { EligibilityFacts, EligibilityStatus } from "@/lib/rules/maternity-eligibility";

export interface ZestawCase {
  id: string;
  fileHint: string;
  title: string;
  story: string;
  facts: EligibilityFacts;
  zus: { status: Exclude<EligibilityStatus, "brak-danych">; text: string };
  source: string;
}

export const ZESTAW: ZestawCase[] = [
  {
    id: "demo-ubezpieczenie",
    fileHint: "A",
    title: "Poród w trakcie umowy o pracę",
    story: "W fikcyjnym przykładzie umowa o pracę trwa przez cały miesiąc, w którym rodzi się dziecko.",
    facts: { applicant: "rodzi", event: "porod", eventDate: "2026-03-17", title: "pracownik", insured: "tak" },
    zus: { status: "przysluguje", text: "W dniu porodu osoba ma ubezpieczenie chorobowe." },
    source: "fikcyjne założenia przykładu A",
  },
  {
    id: "demo-bez-ubezpieczenia",
    fileHint: "B",
    title: "Zlecenie bez ubezpieczenia chorobowego",
    story: "W fikcyjnym przykładzie osoba pracuje na zleceniu i nie przystępuje do dobrowolnego ubezpieczenia chorobowego.",
    facts: { applicant: "rodzi", event: "porod", eventDate: "2026-03-17", title: "zleceniobiorca", insured: "nie" },
    zus: { status: "nie-przysluguje", text: "W dniu porodu osoba nie ma ubezpieczenia chorobowego." },
    source: "fikcyjne założenia przykładu B",
  },
];
