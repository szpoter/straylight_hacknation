import type { EvidenceKind, PageFact } from "./types";

const kinds: Record<string, EvidenceKind> = {
  "e-ZLA": "certificate",
  "ustalenie tytułu": "employment",
  "historia ubezpieczenia": "history",
};
const findings: Record<string, PageFact["value"]> = {
  "niezdolność do pracy": "incapacity",
  "brak ubezpieczenia z tego tytułu": "excluded",
  "podlega ubezpieczeniu z tego tytułu": "covered",
  "nigdy wcześniej nie podlegała ubezpieczeniu chorobowemu": "never",
  "wcześniejsze ubezpieczenie ustało": "ended",
};

export const labels: Record<EvidenceKind, string> = {
  certificate: "Zaświadczenie e-ZLA",
  employment: "Ustalenie ubezpieczenia u płatnika",
  history: "Historia wcześniejszego ubezpieczenia",
};

export function validDate(s: string) {
  if (!/^20\d\d-\d\d-\d\d$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Import only the synthetic, labelled packet. No arbitrary supplied prose is sent to the server. */
export function parsePage(source: string, page: number): PageFact {
  const text = source.normalize("NFC").replace(/\r/g, "").trim();
  if (text.length > 2000 || !/^ZUSIK DEMO\s*\/\s*1\b/.test(text))
    throw new Error("Wybierz stronę oznaczoną ZUSIK DEMO / 1.");
  const fields = [
    ...text.matchAll(
      /(?:^|\s)(Dokument|Osoba|Płatnik|Tytuł|Okres|Początek ciągłej niezdolności|Ustalenie|Kod):\s*(.*?)(?=\s+(?:Dokument|Osoba|Płatnik|Tytuł|Okres|Początek ciągłej niezdolności|Ustalenie|Kod):|$)/gs,
    ),
  ];
  const values = new Map(fields.map((m) => [m[1], m[2].trim().replace(/\s+/g, " ")]));
  if (values.size !== fields.length) throw new Error("Strona zawiera powtórzone pola.");
  const kind = kinds[values.get("Dokument") ?? ""];
  const value = findings[values.get("Ustalenie") ?? ""];
  const [from = "", to = "", ...extra] = (values.get("Okres") ?? "").split(/\s*\/\s*/);
  const onset = values.get("Początek ciągłej niezdolności") ?? null;
  const subject = values.get("Osoba") ?? "";
  const payer = values.get("Płatnik") ?? "";
  const title = values.get("Tytuł") ?? "";
  const validFinding =
    (kind === "certificate" && value === "incapacity") ||
    (kind === "employment" && ["excluded", "covered"].includes(value)) ||
    (kind === "history" && ["never", "ended"].includes(value));
  if (
    !validFinding ||
    !/^DEMO-[A-Z]\d?$/.test(subject) ||
    !/^(?:[A-Z]|wszystkie)$/.test(payer) ||
    !["pracownik", "działalność", "wszystkie"].includes(title) ||
    !validDate(from) ||
    !validDate(to) ||
    from > to ||
    extra.length ||
    (onset !== null && !validDate(onset)) ||
    (values.has("Kod") && values.get("Kod") !== "B")
  )
    throw new Error("Sprawdź oznaczenia demonstracyjne, daty i treść ustalenia na stronie " + page + ".");
  const normalized = ["ZUSIK DEMO / 1", ...[...values].map(([k, v]) => k + ": " + v)].join("\n");
  return { kind, subject, payer, title, period: { from, to }, onset, value, page, text: normalized };
}

export const demoText = `ZUSIK DEMO / 1
Dokument: e-ZLA
Osoba: DEMO-A
Płatnik: A
Tytuł: pracownik
Okres: 2026-11-02 / 2026-11-13
Początek ciągłej niezdolności: 2026-11-02
Ustalenie: niezdolność do pracy
Kod: B
--- STRONA ---
ZUSIK DEMO / 1
Dokument: ustalenie tytułu
Osoba: DEMO-A
Płatnik: A
Tytuł: pracownik
Okres: 2026-11-01 / 2026-11-30
Ustalenie: brak ubezpieczenia z tego tytułu
--- STRONA ---
ZUSIK DEMO / 1
Dokument: historia ubezpieczenia
Osoba: DEMO-A
Płatnik: wszystkie
Tytuł: wszystkie
Okres: 2026-11-02 / 2026-11-13
Ustalenie: nigdy wcześniej nie podlegała ubezpieczeniu chorobowemu`;

export function splitPages(text: string) {
  return text.split(/\s*--- STRONA ---\s*|\f/);
}
export const packetA = splitPages(demoText).map((text, i) => parsePage(text, i + 1));
