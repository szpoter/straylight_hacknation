import type { Box, Candidate, FieldKey } from "../kamil/contract";
import { MONTHS_GEN, isValidIso } from "../rules/dates";
import { isValidPesel, peselBirthDate } from "./identifiers";

/**
 * Reads the fields of a (fictional) "Odpis skrócony aktu urodzenia" from positioned words.
 * The same code handles the PDF text layer and Tesseract output, so both versions of the
 * document produce identical candidates with value, page and box.
 */

export interface OcrWord {
  text: string;
  page: number;
  /** Fractions of the page, origin top-left. */
  box: Box;
  /** 0–100. The PDF text layer is 100. */
  confidence: number;
}

export interface ReadResult {
  fileName: string;
  method: "pdf_text" | "ocr";
  words: OcrWord[];
}

/** Below this word confidence a value goes to review even if it parses. */
export const MIN_CONFIDENCE = 80;

type Kind = "name" | "date" | "pesel" | "place";

const LABELS: { key: FieldKey; kind: Kind; label: string }[] = [
  { key: "child_last_name", kind: "name", label: "nazwisko" },
  { key: "child_first_name", kind: "name", label: "imie imiona" },
  { key: "child_birth_date", kind: "date", label: "data urodzenia" },
  { key: "child_birth_place", kind: "place", label: "miejsce urodzenia" },
  { key: "child_pesel", kind: "pesel", label: "numer pesel" },
  { key: "father_first_name", kind: "name", label: "imie ojca" },
  { key: "father_last_name", kind: "name", label: "nazwisko ojca" },
  { key: "mother_first_name", kind: "name", label: "imie matki" },
  { key: "mother_last_name", kind: "name", label: "nazwisko matki" },
];

export function normalize(text: string): string {
  return text
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function distance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

function union(words: OcrWord[]): Box {
  const x0 = Math.min(...words.map((w) => w.box.x));
  const y0 = Math.min(...words.map((w) => w.box.y));
  const x1 = Math.max(...words.map((w) => w.box.x + w.box.w));
  const y1 = Math.max(...words.map((w) => w.box.y + w.box.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export interface Row {
  page: number;
  label: OcrWord[];
  value: OcrWord[];
}

/** Groups words into lines by vertical centre, then splits each line at its widest gap: label | value. */
export function toRows(words: OcrWord[]): Row[] {
  const rows: Row[] = [];
  const pages = [...new Set(words.map((w) => w.page))].sort((a, b) => a - b);
  for (const page of pages) {
    // OCR turns page borders and dirt into "|", "-", ":" words; they carry no field content.
    const onPage = words
      .filter((w) => w.page === page && /[\p{L}\p{N}]/u.test(w.text))
      .sort((a, b) => a.box.y - b.box.y);
    const lines: OcrWord[][] = [];
    for (const word of onPage) {
      const centre = word.box.y + word.box.h / 2;
      const line = lines.find((l) => {
        const ref = l[0];
        return Math.abs(ref.box.y + ref.box.h / 2 - centre) < Math.max(ref.box.h, word.box.h) * 0.6;
      });
      if (line) line.push(word);
      else lines.push([word]);
    }
    for (const line of lines) {
      line.sort((a, b) => a.box.x - b.box.x);
      if (line.length < 2) continue;
      let split = -1;
      let widest = 0;
      for (let i = 1; i < line.length; i++) {
        const gap = line[i].box.x - (line[i - 1].box.x + line[i - 1].box.w);
        if (gap > widest) {
          widest = gap;
          split = i;
        }
      }
      // Heights are fractions of the page height, gaps of its width: compare in the same unit (A4 ratio).
      const height = Math.max(...line.map((w) => w.box.h)) * (842 / 595);
      if (split < 0 || widest < height * 1.5) continue;
      rows.push({ page, label: line.slice(0, split), value: line.slice(split) });
    }
  }
  return rows;
}

const DIGIT_FIXES: Record<string, string> = {
  O: "0",
  o: "0",
  Q: "0",
  D: "0",
  I: "1",
  l: "1",
  "|": "1",
  S: "5",
  B: "8",
  Z: "2",
};

/** Replaces letters OCR often confuses with digits. Returns the text and whether anything changed. */
function fixDigits(raw: string): { text: string; fixed: boolean } {
  let fixed = false;
  const text = [...raw]
    .map((ch) => {
      if (DIGIT_FIXES[ch]) {
        fixed = true;
        return DIGIT_FIXES[ch];
      }
      return ch;
    })
    .join("");
  return { text, fixed };
}

function parseDate(raw: string): { iso: string | null; fixed: boolean } {
  const cleaned = raw.replace(/\s*r\.?$/i, "").trim();
  const spelled = /^(\d{1,2})\s+(\p{L}+)\s+(\d{4})$/u.exec(cleaned);
  if (spelled) {
    const month = MONTHS_GEN.findIndex((m) => normalize(m) === normalize(spelled[2])) + 1;
    if (month > 0) {
      const iso = `${spelled[3]}-${String(month).padStart(2, "0")}-${spelled[1].padStart(2, "0")}`;
      return { iso: isValidIso(iso) ? iso : null, fixed: false };
    }
  }
  const { text, fixed } = fixDigits(cleaned.replace(/\s+/g, ""));
  const m = /^(\d{2})[.\-/](\d{2})[.\-/](\d{4})$/.exec(text);
  if (!m) return { iso: null, fixed };
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  return { iso: isValidIso(iso) ? iso : null, fixed };
}

/** Matches rows to fields and validates every value. Unclear values are flagged, never guessed. */
export function extractBirthCertificate(read: ReadResult): Candidate[] {
  const rows = toRows(read.words);
  const found = new Map<FieldKey, { row: Row; kind: Kind }>();
  for (const row of rows) {
    const label = normalize(row.label.map((w) => w.text).join(" "));
    if (!label) continue;
    let best: (typeof LABELS)[number] | null = null;
    let bestDistance = Infinity;
    for (const option of LABELS) {
      const d = distance(label, option.label);
      if (d < bestDistance) {
        best = option;
        bestDistance = d;
      }
    }
    if (best && bestDistance <= Math.max(1, Math.floor(best.label.length / 6)) && !found.has(best.key)) {
      found.set(best.key, { row, kind: best.kind });
    }
  }

  const candidates: Candidate[] = [];
  for (const [key, { row, kind }] of found) {
    const raw = row.value.map((w) => w.text).join(" ").trim();
    const confidence = Math.round(Math.min(...row.value.map((w) => w.confidence)));
    const reasons: string[] = [];
    let value = raw;

    if (kind === "date") {
      const parsed = parseDate(raw);
      if (!parsed.iso) reasons.push("Nie da się odczytać pełnej daty");
      else {
        value = parsed.iso;
        if (parsed.fixed) reasons.push("Niektóre znaki daty były niejednoznaczne");
      }
    } else if (kind === "pesel") {
      const { text, fixed } = fixDigits(raw.replace(/\s+/g, ""));
      value = text;
      if (!isValidPesel(text)) reasons.push("Numer PESEL ma błędną długość lub sumę kontrolną");
      else if (fixed) reasons.push("Niektóre cyfry PESEL były niejednoznaczne");
    } else {
      value = raw.replace(/[^\p{L}\s-]/gu, "").replace(/\s+/g, " ").trim();
      if (!value || value !== raw) reasons.push("Odczyt zawiera znaki spoza nazwy");
    }
    if (read.method === "ocr" && confidence < MIN_CONFIDENCE) reasons.push(`Niska pewność odczytu (${confidence}%)`);

    candidates.push({
      key,
      value,
      origin: {
        kind: "document",
        method: read.method,
        fileName: read.fileName.slice(0, 200),
        page: row.page,
        box: union(row.value),
        read: raw.slice(0, 200),
        confidence,
      },
      needsReview: reasons.length > 0,
      reason: reasons.length ? reasons.join(". ").slice(0, 200) : null,
    });
  }

  // Cross-check: the birth date is encoded in the child's PESEL. A misread digit breaks the match.
  const date = candidates.find((c) => c.key === "child_birth_date");
  const pesel = candidates.find((c) => c.key === "child_pesel");
  if (date && pesel && !date.needsReview && !pesel.needsReview && peselBirthDate(pesel.value) !== date.value) {
    for (const c of [date, pesel]) {
      c.needsReview = true;
      c.reason = "Data urodzenia nie zgadza się z numerem PESEL";
    }
  }
  const order = (key: FieldKey) => LABELS.findIndex((l) => l.key === key);
  return candidates.sort((a, b) => order(a.key) - order(b.key));
}
