import { citationUrl, isPrimary, type Corpus, type Fragment } from "./corpus";
import type { PublicQuestion } from "./public-query";
import { corpusKeywords, terms } from "./corpus-search";
import { statutoryListIds } from "./relevance";
import { TOP_K } from "./retrieve";
import type { AskAnswer, AskCitation } from "../zusik/types";

/** A citation can be authentic while the answer omits the condition that selected it. */
export function withSourceException(projected: PublicQuestion, answer: AskAnswer, evidence: Fragment[]): AskAnswer | null {
  if (!projected.fragmentId || answer.status !== "answered") return null;
  const fragment = evidence.find(f => f.logicalId === projected.fragmentId);
  const citation = answer.citations.find(c => c.fragmentId === projected.fragmentId);
  if (!fragment || !citation) return null;
  const hasException = /(?:z wyjątkiem|z wyłączeniem|chyba że)/iu.test(fragment.sourceText);
  const claimText = answer.claims.map(claim => claim.text.toLocaleLowerCase("pl")).join(" ");
  // searchText contains source words. A short prefix also accepts common inflections in the answer.
  const omittedCondition = projected.searchText?.split(" ").some(word =>
    word.length >= 4 && !claimText.includes(word.slice(0, 5).toLocaleLowerCase("pl")));
  if (!hasException && !omittedCondition) return null;
  const targetCitations = new Set(answer.citations.filter(c => c.fragmentId === fragment.logicalId).map(c => c.id));
  const otherClaims = answer.claims.filter(claim => claim.citationIds.every(id => !targetCitations.has(id)));
  const used = new Set(otherClaims.flatMap(claim => claim.citationIds));
  return {
    ...answer,
    message: hasException ? "Podaję pełny fragment, ponieważ przepis przewiduje wyjątek." :
      "Podaję pełny fragment źródła, który uwzględnia szczegóły pytania.",
    claims: [{ text: fragment.sourceText, citationIds: [citation.id] }, ...otherClaims],
    citations: [{ ...citation, quote: fragment.sourceText }, ...answer.citations.filter(c => used.has(c.id))],
  };
}

const articleQuestion = /^Co stanowi (art\. (\d+[a-z]?)(?: ust\. (\d+[a-z]?))?) ustawy zasiłkowej\?$/u;

function presetSources(projected: PublicQuestion): string[] {
  const reviewed: Array<[boolean, string[]]> = [
    [projected.locators?.includes("program:dobry-start:termin") === true, ["dobry-start-termin"]],
    [projected.locators?.includes("program:dobry-start:kanaly") === true, ["dobry-start-kanaly"]],
    [projected.locators?.includes("uz:19") === true, ["uz-19-1"]],
    [projected.corpus === "oferta" && projected.locators?.[0] === "program:800-plus", ["800-plus"]],
    [projected.corpus === "oferta" && projected.locators?.[0] === "program:aktywny-rodzic", ["aktywny-rodzic"]],
    [projected.corpus === "oferta" && projected.locators?.[0] === "program:dobry-start", ["dobry-start"]],
    [projected.question.startsWith("Kiedy można pobierać zasiłek chorobowy po ustaniu"), ["uz-art7", "uz-art13-ust1"]],
    [projected.question.startsWith("Czy samo zwolnienie"), ["uz-art6-ust1", "uz-art7"]],
    [/^Kiedy (?:i na jak długo )?przysługuje świadczenie rehabilitacyjne\?$/u.test(projected.question), ["uz-18-1"]],
    [projected.question.startsWith("Jakie uprawnienia wyłączają prawo do świadczenia rehabilitacyjnego"), ["uz-18-3"]],
    [projected.locators?.includes("rz:33:1") === true, ["rz-par33-ust1"]],
    [projected.locators?.includes("kp:1823:1") === true, ["kp-ojcowski"]],
    [projected.locators?.includes("uz:11:2") === true, ["uz-art11-ust2-pkt1", "uz-art6-ust1"]],
    [projected.question.startsWith("Jakie informacje należy zawrzeć"), ["rozp-2025-322-par15-ust1"]],
    [projected.question.startsWith("Skąd wiadomo, ile części"), ["kp-art182-1d-par2"]],
    [projected.question.startsWith("Kadry mają już odpis"), ["rozp-2025-322-par22", "rozp-2025-322-par15-ust2-pkt1"]],
    [projected.question.startsWith("Czy 9 tygodni urlopu rodzicielskiego"), ["kp-art182-1a-par4"]],
    [projected.question.startsWith("Na ile części można podzielić urlop rodzicielski"), ["kp-art182-1c"]],
    [projected.question.startsWith("Czy wniosek do pracodawcy o urlop rodzicielski można złożyć elektronicznie"), ["kp-art182-1d-par1"]],
    [projected.question.startsWith("Jak połączyć pracę na pół etatu z urlopem rodzicielskim"), ["kp-art182-1e-par2"]],
    [projected.question.startsWith("Ile wcześniej i do kogo"), ["kp-art182-1d-par1"]],
    [projected.locators?.includes("art182^1a§7") === true, ["kp-art182-1a-par7"]],
    [projected.question.startsWith("Czy oboje rodzice mogą"), ["kp-art182-1a-par6"]],
    [/^Co (?:wpisać o drugim rodzicu|oświadczyć we wniosku)/u.test(projected.question), ["rozp-2025-322-par15-ust2-pkt2"]],
  ];
  return reviewed.find(([applies]) => applies)?.[1] ?? [];
}

function reviewedSources(projected: PublicQuestion, corpus?: Corpus) {
  if (projected.requiredFragmentIds?.length) return { ids: projected.requiredFragmentIds, requireAll: true };
  if (projected.quoteProvision) return {ids:[projected.quoteProvision], requireAll:true};
  const article = projected.corpus === "publiczne" && projected.question.match(articleQuestion);
  const preset = article ? [] : presetSources(projected);
  if (preset.length) return { ids: preset, requireAll: false };

  const single = projected.locators?.length === 1 ? projected.locators[0] : undefined;
  const key = article ? ["uz", article[2], article[3]].filter(Boolean).join(":") : single;
  const ids: string[] = [];
  if (corpus && projected.corpus === "publiczne" && key) {
    const seen = new Set<string>();
    for (const f of corpus.fragments.values()) {
      if (!f.locatorKeys.includes(key) || !isPrimary(corpus, f) || seen.has(f.fragmentSha256)) continue;
      // A hand-selected excerpt from one point is insufficient for an entire paragraph.
      if (article && f.locator !== article[1]) continue;
      seen.add(f.fragmentSha256);
      ids.push(f.logicalId);
    }
  }
  return { ids: ids.length <= TOP_K ? ids : [], requireAll: true };
}

export function reviewedSourceIds(projected: PublicQuestion, corpus?: Corpus): string[] {
  return reviewedSources(projected, corpus).ids;
}

function answerSources(projected: PublicQuestion, corpus: Corpus | undefined, rankedIds: string[]) {
  const target = projected.fragmentId && corpus?.fragments.get(projected.fragmentId);
  if (!corpus || !target || projected.requiredFragmentIds?.length || !corpusKeywords(projected.question, target))
    return {...reviewedSources(projected, corpus), listComplete:true};
  const list = statutoryListIds(corpus, target);
  // A list item without its introductory clause can change the subject of a rule.
  const ids = [...new Set([...list, ...target.relatedIds.filter(id => rankedIds.includes(id))])];
  return {ids, requireAll:true, listComplete:list.every(id => rankedIds.includes(id))};
}

/** Quote confirmed units together so that an exception in a later chunk travels with the rule. */
export function extractiveAnswer(
  corpus: Corpus, projected: PublicQuestion, evidence: Fragment[], confirmedIds: string[], rankedIds = confirmedIds,
): AskAnswer | null {
  const { ids, requireAll, listComplete } = answerSources(projected, corpus, rankedIds);
  const confirmed = (id: string) => confirmedIds.includes(id);
  if (!listComplete || !ids.length || !(requireAll ? ids.every(confirmed) : ids.some(confirmed))) return null;
  const citations: AskCitation[] = [];
  for (const id of ids) {
    const fragment = evidence.find((f) => f.logicalId === id);
    const doc = fragment && corpus.documents.get(fragment.documentId);
    if (!fragment || !doc) return null;
    let quote = fragment.sourceText;
    if (id === "uz-19-1" && !articleQuestion.test(projected.question) && !projected.fragmentId && !projected.requiredFragmentIds?.length) quote = quote.split(" 2. ")[0];
    if (id === "dobry-start" && ids.length === 1 && !projected.fragmentId) quote = quote.split(" Wniosek złożysz")[0];
    citations.push({
      id: "c" + (citations.length + 1), fragmentId: id, title: doc.shortTitle,
      locator: fragment.locator, url: citationUrl(corpus, fragment), quote,
      headingPath: fragment.headingPath, page: fragment.page, authority: doc.authority,
      corpusVersion: corpus.manifest.corpusVersion,
    });
  }
  return {
    status: "answered", corpusVersion: corpus.manifest.corpusVersion,
    message: "Cytuję treść ze wskazanego źródła urzędowego.",
    claims: citations.map((c) => ({ text: c.quote, citationIds: [c.id] })), citations,
  };
}

const month = "stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia";
const calendarDate = `(?:[1-9]|[12]\\d|3[01]) (?:${month})(?: \\d{4})?`;
const closedPeriod = new RegExp(`\\bod (?:dnia )?(${calendarDate})(?: r\\.| roku| danego roku)? do (?:dnia )?(${calendarDate})`, "giu");

function omitsPeriodBoundary(question: string, claimText: string, passages: string[]) {
  if (!/od kiedy.{0,30}do kiedy|(?:począt|zaczyn).{0,40}ko[nń]|granice okresu|przez jaki okres/iu.test(question)) return false;
  const dates: string[] = claimText.toLowerCase().match(new RegExp(`(?<!\\d)${calendarDate}`, "gu")) ?? [];
  return passages.some(passage => [...passage.toLowerCase().matchAll(closedPeriod)].some(([, start, end]) => {
    const at = dates.indexOf(start);
    return at < 0 || !dates.includes(end, at + 1);
  }));
}

/** The current-title rule and the exception after coverage ended are alternatives.
 * Authentic citations alone did not prevent a model from calling the exception mandatory. */
export function needsStatutoryText(projected: PublicQuestion, answer: AskAnswer, corpus?: Corpus, rankedIds: string[] = []): boolean {
  const {ids: required, listComplete} = answerSources(projected, corpus, rankedIds);
  if (!listComplete) return true;
  if (required.length > 1) {
    const covered = new Set(answer.claims.flatMap(claim => {
      const cited = answer.citations.filter(c => claim.citationIds.includes(c.id));
      const source = cited[0]?.fragmentId;
      if (!source || !cited.every(c => c.fragmentId === source)) return [];
      // Repeating the same point under a second citation does not explain the second condition.
      const own = terms(cited.map(c => c.quote).join(" "));
      const other = terms(answer.citations.filter(c => c.fragmentId !== source).map(c => c.quote).join(" "));
      const distinct = [...terms(claim.text).keys()].filter(key => own.has(key) && !other.has(key));
      return distinct.length >= 2 ? [source] : [];
    }));
    if (required.some(id => !covered.has(id))) return true;
  }
  const claims = answer.claims.map(c => c.text).join(" ");
  if (corpus && omitsPeriodBoundary(projected.question, claims, required.map(id => corpus.fragments.get(id)?.sourceText ?? ""))) return true;
  if (projected.fragmentId) return !answer.citations.some(c => c.fragmentId === projected.fragmentId);
  if (projected.corpus === "publiczne" && articleQuestion.test(projected.question)) return true;
  if (projected.locators?.includes("program:dobry-start"))
    return !answer.citations.some(c => c.fragmentId === "dobry-start") || !/300\s*(?:zł|PLN)/iu.test(claims);
  if (projected.locators?.includes("program:dobry-start:termin"))
    return !answer.citations.some(c => c.fragmentId === "dobry-start-termin") ||
      !["1 lipca", "30 listopada", "orzeczen"].every(term => claims.toLowerCase().includes(term));
  if (projected.locators?.includes("program:dobry-start:kanaly"))
    return !answer.citations.some(c => c.fragmentId === "dobry-start-kanaly") ||
      !["mzus", "ezus", "emp@tia", "bankowo"].every(term => claims.toLowerCase().includes(term));
  if (projected.locators?.includes("uz:19"))
    return !answer.citations.some(c => c.fragmentId === "uz-19-1") ||
      !["90", "75", "100", "ciąż"].every(term => claims.toLowerCase().includes(term));
  if (/^Kiedy (?:i na jak długo )?przysługuje świadczenie rehabilitacyjne\?$/u.test(projected.question)) {
    const text = answer.claims.map(c => c.text).join(" ");
    return !answer.citations.some(c => c.fragmentId === "uz-18-1") ||
      (projected.question.includes("jak długo") && !/(?:12|dwunast\p{L}*) miesi/iu.test(text)) ||
      !/wyczerp|wykorzyst/iu.test(text) || !/niezdoln/iu.test(text) || !/odzysk|powr[oó][ct]/iu.test(text);
  }
  if (projected.question.startsWith("Jakie uprawnienia wyłączają prawo do świadczenia rehabilitacyjnego"))
    return !answer.citations.some(c => c.fragmentId === "uz-18-3");
  if (projected.locators?.includes("art182^1a§7"))
    return !answer.citations.some((c) => c.fragmentId === "kp-art182-1a-par7" || c.fragmentId === "mrpips-dzielenie-zasilek");
  const current = projected.question.startsWith("Czy samo zwolnienie");
  const previous = projected.question.startsWith("Kiedy można pobierać zasiłek chorobowy po ustaniu");
  if (!current && !previous) return false;
  const text = answer.claims.map((c) => c.text).join(" ");
  // A paraphrase of Article 7 that mentions three months must preserve the
  // delayed-onset condition. Article 13 exclusions are decisive for the
  // previous-title question and belong in the evidence.
  if (previous && !answer.citations.some((c) => c.fragmentId === "uz-art13-ust1" || c.fragmentId.startsWith("uz-13-"))) return true;
  if (current && !/(?:w (?:czasie|trakcie)(?: trwania)?|podczas(?: trwania)?) ubezpieczenia/iu.test(text)) return true;
  if (current && /musi.{0,120}po ustaniu/iu.test(text)) return true;
  return /(?:3|trz[ey](?:ch)?) miesi/iu.test(text) && !/(?:wylęg|objaw).{0,140}(?:dłuższ|później|ponad).{0,30}14/iu.test(text);
}
