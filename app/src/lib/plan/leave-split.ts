/**
 * Podział urlopu rodzicielskiego między dwoje rodziców — adapter widoku „Mój plan” na regułę
 * Juliana (`lib/marta/case.ts`, `applyMarta`). Liczy wyłącznie jego funkcja: daty od–do, termin
 * wniosku (21 dni przed startem) i kwotę = stawka dzienna × dni. Tu tylko budujemy wejście
 * z planu, walidujemy je jego schematem i nakładamy wybrany wariant na przystanek ścieżki.
 *
 * Źródła (sprawdzone 22.11.2026, gov.pl „Urlop rodzicielski”,
 * https://www.gov.pl/web/rodzina/urlop-rodzicielski):
 * - wniosek „w terminie nie krótszym niż 21 dni przed rozpoczęciem korzystania z urlopu”,
 * - „Z urlopu rodzicielskiego mogą jednocześnie korzystać oboje pracownicy – rodzice dziecka.”
 * Niepotwierdzone, więc NIE twierdzimy: że urlop rodzicielski musi zacząć się zaraz po
 * macierzyńskim. Dzień po końcu macierzyńskiego to tylko podpowiedź daty do zmiany.
 *
 * TODO(julian): po podłączeniu backendu wywołać `POST /api/zusik/marta` zamiast funkcji lokalnie
 * (ten sam kształt odpowiedzi `MartaView`), a wybór zapisać w sprawie zamiast w przeglądarce.
 */
import { applyMarta } from "@/lib/marta/case";
import { commandSchema, type MartaView, type Variant } from "@/lib/marta/types";
import { addDays, daysBetween, formatLong } from "@/lib/demo/dates";
import { leaveWeeks } from "@/lib/plan/build";
import type { Plan, Stop } from "@/lib/demo/types";

export type { Variant as SplitVariant } from "@/lib/marta/types";

/** Limit długości na rodzica z walidacji Juliana (`days` 1–143). W tygodniach: pełne 20. */
export const MAX_DAYS_EACH = 143;
export const MAX_WEEKS_EACH = Math.floor(MAX_DAYS_EACH / 7);
/** Wyprzedzenie wniosku do pracodawcy (gov.pl „Urlop rodzicielski”). */
export const NOTICE_DAYS = 21;

export const PARENTAL_SOURCE = { label: "gov.pl · Urlop rodzicielski", url: "https://www.gov.pl/web/rodzina/urlop-rodzicielski" };

export const VARIANT_LABEL: Record<Variant, string> = { together: "Razem", sequential: "Po kolei" };

/** Dane podziału wpisane przez rodzica. Stawka `null` = „nie wiem”, kwota wtedy się nie liczy. */
export type SplitInput = {
  start: string;
  weeks: number;
  rates: [number | null, number | null];
};

/** Zapisany wybór: dane i wariant. */
export type LeaveSplit = SplitInput & { variant: Variant };

export type SplitResult = { ok: true; view: MartaView } | { ok: false; error: string };

/** Klucz zapisu: rodzeństwo z jednego porodu dzieli jeden urlop, więc jeden podział na grupę. */
export function splitKey(plan: Pick<Plan, "id" | "family">): string {
  return plan.family?.groupId ?? plan.id;
}

const baseId = (s: Stop) => s.id.replace(/^e-/, "");

/** Przystanek „Urlop rodzicielski” w planie (w planach oczekiwanych ma przedrostek `e-`). */
export function parentalStop(plan: Plan): Stop | undefined {
  return plan.stops.find((s) => baseId(s) === "rodzicielski");
}

/** Czy w tym planie podział ma sens: jest przystanek urlopu, nie minął i znamy datę kluczową. */
export function canSplit(plan: Plan): boolean {
  const stop = parentalStop(plan);
  return Boolean(stop && plan.keyDate && plan.situation !== "planuje" && stop.state !== "minelo" && stop.state !== "nie-korzystam");
}

/** Liczba dzieci z jednego porodu: rodzeństwo z planu albo odpowiedź z onboardingu. */
function childCount(plan: Plan): number {
  if (plan.family) return plan.family.names.length;
  const c = plan.origin?.answers?.childCount;
  return c === "2" ? 2 : c === "3" ? 3 : 1;
}

/**
 * Podpowiedź daty startu: dzień po końcu urlopu macierzyńskiego liczonego od daty kluczowej
 * (urodzenie, termin porodu albo przyjęcie), wymiar z `leaveWeeks` (gov.pl, 20/31/33/35/37 tyg.).
 * Tylko podpowiedź — rodzic zmienia ją w polu daty.
 */
export function suggestedStart(plan: Plan): string | undefined {
  if (!plan.keyDate) return undefined;
  return addDays(plan.keyDate, leaveWeeks(childCount(plan)).maternity * 7);
}

/** Domyślne dane formularza: zapisany wybór, a bez niego podpowiedź daty, 4 tygodnie i stawki z demo. */
export function defaultInput(plan: Plan, saved?: LeaveSplit): SplitInput {
  if (saved) return { start: saved.start, weeks: saved.weeks, rates: saved.rates };
  const parents = plan.calculator?.parents ?? [];
  const rate = (id: "ty" | "partner") => parents.find((p) => p.id === id)?.dailyRate ?? null;
  return { start: suggestedStart(plan) ?? "", weeks: 4, rates: [rate("ty"), rate("partner")] };
}

/** Imię do schematu Juliana (litery, spacje, kropka, apostrof, myślnik; do 90 znaków). */
function safeName(value: string, fallback: string): string {
  const cleaned = value.replace(/[^\p{L}\p{M} .’'-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 90);
  return cleaned || fallback;
}

const ERRORS: Record<string, string> = {
  firstStart: "Podaj prawidłową datę rozpoczęcia.",
  days: `Każde z Was może tu zaplanować od 1 do ${MAX_WEEKS_EACH} tygodni.`,
  firstDaily: "Stawka musi być kwotą od 0 do 100 000 zł, z groszami najwyżej do 2 miejsc.",
  secondDaily: "Stawka musi być kwotą od 0 do 100 000 zł, z groszami najwyżej do 2 miejsc.",
};

/** Liczy oba warianty regułą Juliana. Błędy walidacji wracają jako zdanie dla rodzica. */
export function computeSplit(input: SplitInput, childName: string): SplitResult {
  const parsed = commandSchema.safeParse({
    type: "compare",
    version: 0,
    firstStart: input.start,
    days: input.weeks * 7,
    firstDaily: input.rates[0],
    secondDaily: input.rates[1],
    firstName: "Ty",
    secondName: "Drugi rodzic",
    childName: safeName(childName, "Dziecko"),
  });
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return { ok: false, error: ERRORS[field] ?? "Sprawdź wpisane dane." };
  }
  const result = applyMarta(null, parsed.data);
  if (result.status !== 200 || !result.view) return { ok: false, error: "Nie udało się policzyć wariantów. Sprawdź wpisane dane." };
  return { ok: true, view: result.view };
}

/** Kwota z groszami: „3 920,00 zł” (twarde spacje, bez zależności od ustawień przeglądarki). */
export function formatPln(value: number): string {
  const [int, dec] = value.toFixed(2).split(".");
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, " ")},${dec} zł`;
}

/** Jedno zdanie różnicy między wariantami — z liczb Juliana, bez ocen. */
export function differenceSentence(view: MartaView): string {
  const t = view.variants.together;
  const s = view.variants.sequential;
  const longer = s.calendarDays - t.calendarDays;
  const money = t.total !== null && s.total !== null && t.total === s.total ? " Kwota jest taka sama." : "";
  return `Po kolei dziecko jest z rodzicem w domu o ${longer} ${longer === 1 ? "dzień" : "dni"} dłużej. Razem — oboje jesteście w domu w tym samym czasie.${money}`;
}

/** Czy termin wniosku już minął (wtedy pokazujemy uwagę przy wariancie). */
export function deadlinePassed(deadline: string, today: string): boolean {
  return daysBetween(today, deadline) < 0;
}

/**
 * Nakłada wybrany wariant na przystanek „Urlop rodzicielski”: termin = najwcześniejszy wniosek,
 * warunek z datą startu i notatka z oboma okresami (ze źródłem). Bez wyboru plan bez zmian.
 */
export function applySplit(plan: Plan, split?: LeaveSplit): Plan {
  if (!split) return plan;
  const stop = parentalStop(plan);
  if (!stop || stop.state === "minelo") return plan;
  const result = computeSplit(split, plan.name);
  if (!result.ok) return plan;
  const v = result.view.variants[split.variant];
  const deadline = v.first.deadline <= v.second.deadline ? v.first.deadline : v.second.deadline;
  const together = split.variant === "together";
  const text = together
    ? `Wybrany wariant „Razem”: oboje od ${formatLong(v.first.from)} do ${formatLong(v.first.to)}. Każde z Was składa wniosek swojemu pracodawcy do ${formatLong(v.first.deadline)}.`
    : `Wybrany wariant „Po kolei”: Ty od ${formatLong(v.first.from)} do ${formatLong(v.first.to)} (wniosek do ${formatLong(v.first.deadline)}), drugi rodzic od ${formatLong(v.second.from)} do ${formatLong(v.second.to)} (wniosek do ${formatLong(v.second.deadline)}).`;
  const next: Stop = {
    ...stop,
    due: deadline,
    dueBasis: "Wniosek co najmniej 21 dni przed rozpoczęciem urlopu",
    condition: stop.condition ? `Od ${formatLong(v.first.from)} · wariant „${VARIANT_LABEL[split.variant]}”` : stop.condition,
    notes: [...(stop.notes ?? []), { text, sources: [PARENTAL_SOURCE] }],
    doc: stop.doc ? { ...stop.doc, note: `Wniosek do ${formatLong(deadline)}` } : stop.doc,
  };
  return { ...plan, stops: plan.stops.map((s) => (s.id === stop.id ? next : s)) };
}
