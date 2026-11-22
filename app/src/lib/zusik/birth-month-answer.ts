import { blankCalculatorForm, computeForm } from "../plan/benefit-form";
import { citationUrl, isValidOn, type Corpus } from "../rag/corpus";
import { parseIso } from "../rules/dates";
import type { AskAnswer, AskCitation } from "./types";

/** Compare the mother's first calendar month using the same form and rounding as the calculator. */
export function birthMonthAnswer({ date, basis }: { date: string; basis: number }, corpus: Corpus): AskAnswer | null {
  const month = parseIso(date).toLocaleDateString("pl-PL", { month: "long", timeZone: "UTC" });
  const money = new Intl.NumberFormat("pl-PL", { useGrouping: "always", maximumFractionDigits: 2 });
  const citations: AskCitation[] = [];
  const claims = [];
  const form = blankCalculatorForm();
  for (const [variant, fragmentId] of [["815", "uz-31-2"], ["100-70", "uz-31-1"]] as const) {
    const fragment = corpus.fragments.get(fragmentId);
    const doc = fragment && corpus.documents.get(fragment.documentId);
    if (!fragment || !doc || !isValidOn(corpus, fragment, date)) return null;
    const { result } = computeForm({ ...form, date, variant, parentalWeeksA: 32,
      A: { ...form.A, mode: "known", known: String(basis) } }, { requireComplete: true });
    const segment = result?.segments.find(s => s.periodId === "mat-A" && s.month === date.slice(0, 7));
    if (!segment) return null;
    const id = "c" + (citations.length + 1);
    citations.push({ id, fragmentId, sourceId: doc.id, title: doc.shortTitle, locator: fragment.locator,
      url: citationUrl(corpus, fragment), quote: fragment.sourceText.split(/ 3a\. | 2\. Miesięczny/u)[0],
      page: fragment.page, headingPath: fragment.headingPath, authority: doc.authority, origin: "corpus",
      hash: fragment.fragmentSha256, corpusVersion: corpus.manifest.corpusVersion });
    claims.push({ text: `Przy ${money.format(segment.ratePct)}% za ${month}: ${money.format(segment.amount)} zł brutto (${segment.days} dni po ${money.format(segment.daily)} zł${segment.topUp ? ", z podwyższeniem" : ""}).`, citationIds: [id] });
  }
  return { status: "answered", claims, citations, corpusVersion: corpus.manifest.corpusVersion,
    message: `Wyliczenie od dnia porodu, przy podstawie ${money.format(basis)} zł. Wariant 81,5% zakłada złożenie odpowiedniego wniosku w terminie.` };
}
