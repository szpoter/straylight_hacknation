import { addDays } from "@/lib/demo/dates";
import type { CalculatorPlan, Parent, Segment, Variant } from "@/lib/demo/types";

/**
 * Podsumowanie wariantu na danych przykładowych (stawki dzienne już ustalone).
 * TODO(backend): kwoty i limity policzy lib/rules — tu tylko suma dni × stawka z danych.
 */
export type SegmentResult = Segment & { end: string; amount?: number; parent: Parent };

export type VariantSummary = {
  segments: SegmentResult[];
  /** Dni kalendarzowe objęte opieką (wspólny dzień liczony raz), bez ojcowskiego. */
  calendarDays: number;
  /** Suma znanych kwot; `complete` = false, gdy brakuje podstawy. */
  total: number;
  complete: boolean;
  plannedWeeks: number;
  plannedWeeksBy: Record<Parent["id"], number>;
};

export function segmentEnd(segment: Segment): string {
  return addDays(segment.start, segment.days - 1);
}

export function summarize(calc: CalculatorPlan, variant: Variant): VariantSummary {
  const parents = Object.fromEntries(calc.parents.map((p) => [p.id, p])) as Record<Parent["id"], Parent>;
  const segments: SegmentResult[] = variant.segments.map((s) => {
    const parent = parents[s.parentId];
    const amount = !s.draft && parent.dailyRate !== undefined ? s.days * parent.dailyRate : undefined;
    return { ...s, end: segmentEnd(s), amount, parent };
  });
  const counted = segments.filter((s) => s.kind === "rodzicielski");
  const days = new Set<string>();
  for (const s of counted) for (let i = 0; i < s.days; i++) days.add(addDays(s.start, i));
  const plannedWeeksBy = { ty: 0, partner: 0 } as Record<Parent["id"], number>;
  for (const s of counted) plannedWeeksBy[s.parentId] += s.days / 7;
  return {
    segments,
    calendarDays: days.size,
    total: counted.reduce((sum, s) => sum + (s.amount ?? 0), 0),
    complete: counted.every((s) => s.amount !== undefined),
    plannedWeeks: plannedWeeksBy.ty + plannedWeeksBy.partner,
    plannedWeeksBy,
  };
}

export type PoolState = { kind: "left" | "full" | "over"; weeks: number; headline: string };

export function poolState(calc: CalculatorPlan, summary: VariantSummary): PoolState {
  const left = calc.poolWeeks - calc.usedWeeks - summary.plannedWeeks;
  if (left > 0) return { kind: "left", weeks: left, headline: `Zostało ${fmtWeeks(left)} tyg. do zaplanowania` };
  if (left === 0) return { kind: "full", weeks: 0, headline: "Wszystkie tygodnie w planie" };
  return { kind: "over", weeks: -left, headline: `${fmtWeeks(-left)} tyg. za dużo` };
}

function fmtWeeks(w: number): string {
  return Number.isInteger(w) ? String(w) : w.toFixed(1).replace(".", ",");
}

/** Nagłówek porównania jako różnica względem wariantu A. */
export function compareHeadline(a: VariantSummary, b: VariantSummary): { headline: string; sentence: string } {
  const sameAmount = a.total === b.total;
  const togetherDays = a.calendarDays - b.calendarDays; // o tyle dni okresy w B się pokrywają
  const togetherWeeks = Math.round(togetherDays / 7);
  const amountPart = sameAmount ? "ta sama kwota" : `${b.total > a.total ? "+" : "−"}${Math.abs(b.total - a.total)} zł`;
  const togetherPart = togetherWeeks > 0 ? `razem w domu ${togetherWeeks} ${togetherWeeks === 1 ? "tydzień" : togetherWeeks < 5 ? "tygodnie" : "tygodni"}` : "bez wspólnego czasu";
  return {
    headline: `Wariant B: ${amountPart} · ${togetherPart}`,
    sentence:
      togetherWeeks > 0
        ? `Przy wspólnym rozpoczęciu spędzicie razem ${togetherWeeks} ${togetherWeeks < 5 ? "tygodnie" : "tygodni"}.${sameAmount ? " Łączna kwota zasiłku za wybrane okresy pozostaje taka sama." : ""}`
        : "Warianty różnią się kwotą.",
  };
}
