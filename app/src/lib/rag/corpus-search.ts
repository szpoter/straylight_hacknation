import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { relevantFragment } from "./relevance";
import { benefitFilter } from "./benefit-scope";
import { isPrimary, isValidOn, type Corpus, type Fragment } from "./corpus";
import { corpusNames, loadCorpus } from "./corpus-fs";
import { asksAboutOwnEligibility, offerDocuments, publicLegalFacet, type PublicQuestion } from "./public-query";
import type { AskTurn } from "../zusik/types";

const stop = new Set(("gdzie kiedy dlaczego dlaczego jakiego jakich jakie jaki jaka jakim jeśli jeżeli przez można mogę może wtedy takiej takiego " +
  "jakieś mnie moje moja moim jest było będzie mogą muszę musi wiem chodzi pytam skutki oznacza zasady przypadku sytuacji " +
  "pytanie osoba osoby według tego jakie miesięcy oraz albo który która które których którym która państwo proszę wtedy przecież teraz tylko zanim komu można jaki czyj działa dzieje razie wpływa konsekwencje temat").split(" "));
interface Dictionary { forms: Record<string,string>; neighbors: Record<string,string[]> }
let dictionary: Dictionary;
function lemma(word: string) {
  dictionary ??= JSON.parse(gunzipSync(readFileSync(join(process.cwd(), "corpus/corpus-lexicon.json.gz"))).toString("utf8"));
  const base = Object.hasOwn(dictionary.forms, word) ? dictionary.forms[word] : word;
  return base;
}
const fold = (word: string) => word.toLowerCase().replaceAll("ł", "l").normalize("NFD").replace(/\p{M}/gu, "");
// Shared stems match common Polish inflections. Low-confidence matches stay unanswered.
export function terms(text: string) {
  const words = new Map<string, string>();
  for (const word of text.toLowerCase().match(/[a-ząćęłńóśźż]{4,}/gu) ?? []) {
    if (!stop.has(word)) {
      const key = fold(lemma(word)).slice(0, 5);
      if (!words.has(key)) words.set(key, word);
    }
  }
  return words;
}

// Use full lemmas for phrases so e.g. „składki” cannot match „składniki wynagrodzenia”.
function phrases(text: string) {
  const words = (text.toLowerCase().match(/[a-ząćęłńóśźż]{4,}/gu) ?? [])
    .filter(word => !stop.has(word)).map(lemma);
  return new Set(words.slice(1).map((word, i) => words[i] + " " + word));
}

export const intents = {
  info: "Jakie ogólne zasady wynikają ze źródła?",
  entitlement: "Jaka zasada określa prawo do świadczenia w tej sytuacji?",
  duration: "Przez jaki okres obowiązuje ta zasada?",
  deadline: "Jaki termin wynika ze źródła?",
  documents: "Jakie dokumenty są wymagane?",
  payer: "Kto dokonuje wypłaty?",
  proof: "Kto i w jaki sposób potwierdza tę okoliczność?",
  recipient: "Komu wypłaca się świadczenie w tej sytuacji?",
  rate: "Jaki procent podstawy wymiaru stosuje się w tej sytuacji?",
} as const;

type Intent = keyof typeof intents;
const separator = " Hasła ze źródła: ";
function intent(text: string): Intent {
  if (/procent|stawka|stawki|wysokoś[ćc]i? zasiłku/iu.test(text)) return "rate";
  if (/komu.{0,32}(?:wypłac|przypada|przekaz|przysług)|kto.{0,20}(?:odbiera|otrzyma|dostaje)/iu.test(text)) return "recipient";
  if (/poświadcz|potwierdz|stwierdz|udowod|dowodem|dowieść|jak.{0,24}zaświadczyć/iu.test(text)) return "proof";
  if (/jak długo|na jak długo|przez ile|ile (?:dni|tygodni|miesięcy)|jak dług[io]|jaki okres/iu.test(text)) return "duration";
  if (/do kiedy|ile czasu na|w jakim czasie|termin|kiedy najpóźniej/iu.test(text)) return "deadline";
  if (/dokument|załącz|dołącz|papiery/iu.test(text)) return "documents";
  if (/kto.{0,20}(?:płaci|wypłac)/iu.test(text)) return "payer";
  if (/można (?:otrzym|pobier)|przysługuje|uprawnia(?:ją)? do (?:zasiłku|świadczenia|urlopu|wypłaty)|(?:zachowuje|traci|ma) prawo do/iu.test(text)) return "entitlement";
  return "info";
}

export const facetEvidence: Record<Exclude<Intent,"info">, RegExp> = {
  entitlement: /przysług|(?:prawo|prawa) do|uprawnion/iu,
  duration: /dni|dnia|dzień|tygodni|miesię|miesią|przez|okres|lat\b|rok/iu,
  deadline: /termin|do dnia|w ciągu|najpóźniej|wcześniej|po upływie/iu,
  payer: /wypłac|płatni/iu,
  documents: /dokument|wniosek|odpis|załącz|zaświadczeni/iu,
  rate: /%|procent/iu,
  recipient: /wypłaca się|osob(?:ie|om) uprawnion/iu,
  proof: /stwierdz|potwierdz|orzecze|zaświadcze|dowod|dowód/iu,
};
export function query(kind: Intent, words: string[]) {
  return intents[kind] + separator + words.join(", ");
}

// Verify the last boundary against the immutable packaged evidence. Never accept a raw sentence as a prompt.
export function corpusKeywords(question: string, fragment: Fragment): string[] | null {
  const [instruction, keywords] = question.split(separator);
  if (!Object.values<string>(intents).includes(instruction) || !keywords) return null;
  const selected = keywords.split(", ");
  if (selected.length < 2 || selected.length > 8) return null;
  const allowed = [...terms(fragment.sourceText).values()].filter(word => selected.includes(word));
  return allowed.join(", ") === keywords && question === instruction + separator + keywords ? allowed : null;
}

type Entry = { name: typeof corpusNames[number]; corpus: Corpus; fragment: Fragment; words: Map<string, string>; phrases: Set<string> };
function buildIndex() {
  const entries: Entry[] = [];
  const frequency = new Map<string, number>();
  for (const name of corpusNames) {
    const corpus = loadCorpus(name);
    for (const fragment of corpus.fragments.values()) {
      const words = terms(fragment.sourceText);
      for (const key of words.keys()) frequency.set(key, (frequency.get(key) ?? 0) + 1);
      entries.push({ name, corpus, fragment, words, phrases: phrases(fragment.sourceText) });
    }
  }
  return { entries, frequency };
}
let cached: ReturnType<typeof buildIndex> | undefined;

export function searchCorpus(text: string, direct?: PublicQuestion | null, kind = publicLegalFacet(text) ?? intent(text), citedDocument?: string): PublicQuestion | null {
  const matchesBenefit = benefitFilter(text);
  const statuteDetail = publicLegalFacet(text);
  if (statuteDetail) text = (text.startsWith("Zasiłek chorobowy.") ? "zasiłek chorobowy " : "") + text.split(" — ")[1];
  const {entries, frequency} = cached ??= buildIndex();
  const scopes = direct?.corpus === "oferta" ? offerDocuments.filter(([name]) => name.test(text)) : [];
  const scope = scopes.length === 1 ? scopes[0] : undefined;
  if (direct?.corpus === "oferta" && !scope) return null;
  const raw = terms(scope ? text.replace(scope[0], "") : text);
  const input = [...raw].filter(([, word]) => !/^dotycz/iu.test(word)).map(([key]) => key);
  // A follow-up passes a bag of source words without their original order. Programme
  // lookups also use unordered projected terms. Neither supplies phrase evidence.
  const inputPhrases = !scope && (kind === "info" || kind === "deadline") ? [...phrases(text)] : [];
  const variants = input.map(key => {
    const word = lemma(raw.get(key)!);
    const related = Object.hasOwn(dictionary.neighbors, word) ? dictionary.neighbors[word] : [];
    return [...new Set([key, ...related.map(w => fold(w).slice(0,5))])].filter(k => frequency.has(k));
  });
  const idf = (key: string) => Math.log((entries.length + 1) / (1 + (frequency.get(key) ?? 0)));
  const kept = terms(direct?.question ?? "");
  const anchors = direct?.locators?.length ? entries.filter(entry =>
    entry.name === direct.corpus && entry.fragment.locatorKeys.some(key => direct.locators!.includes(key))) : [];
  const isExtra = (key: string) => idf(key) > 2.7 && !kept.has(key) && (direct?.broad || !anchors.some(entry => entry.words.has(key)));
  const broadMismatch = direct?.broad && !/(?:samo|sam[ea] w sobie|czy wystarczy|czy wystarcza|kiedy musi powstać)/iu.test(text);
  const unknownCondition = direct && (broadMismatch || (input.filter(isExtra).length >= 2 &&
    /\b(?:jeśli|jeżeli|gdy|skutkiem|skutek|pomimo|mimo|wskutek)|z powodu|pod warunkiem|w razie/iu.test(text)))
    ? { corpus:direct.corpus, question:"", clarify:"Który warunek chcesz sprawdzić? Nie udało mi się powiązać całej opisanej sytuacji z konkretnym przepisem." }
    : null;
  const day = new Date().toISOString().slice(0, 10);
  let ranked = entries.flatMap(entry => {
    if (!matchesBenefit(entry.corpus, entry.fragment)) return [];
    if (citedDocument && entry.fragment.documentId !== citedDocument) return [];
    if (scope && entry.fragment.documentId !== scope[1]) return [];
    if (statuteDetail && (entry.name !== "publiczne" || entry.fragment.documentId !== "uz")) return [];
    if (!isValidOn(entry.corpus, entry.fragment, day) || (kind !== "info" && !facetEvidence[kind].test(entry.fragment.sourceText))) return [];
    const weights = new Map<string, number>();
    for (let i = 0; i < variants.length; i++) {
      const key = variants[i].find(k => entry.words.has(k));
      if (key) weights.set(key, Math.max(weights.get(key) ?? 0, key === input[i] ? 1 : 0.45));
    }
    const matches = [...weights.keys()];
    const exact = matches.filter(key => weights.get(key) === 1);
    const phraseHits = inputPhrases.filter(phrase => entry.phrases.has(phrase));
    if (matches.length < 2 || !exact.length || (!matches.some(key => idf(key) > 3.3) && phraseHits.length < 2)) return [];
    const positions = [...entry.words.keys()].flatMap((key, index) => matches.includes(key) && idf(key) > 2 ? [index] : []);
    const adjacent = positions.some((at,i) => i > 0 && at - positions[i-1] <= 4);
    // For legal conditions, prefer the provision over a form or guide which restates its vocabulary.
    const primary = isPrimary(entry.corpus, entry.fragment);
    const legalWeight = primary && phraseHits.length >= 2 ? 1.25 :
      primary && ["entitlement", "rate", "proof", "deadline"].includes(kind) ? 1.15 : 1;
    const score = matches.reduce((sum,key) => sum + idf(key) * weights.get(key)!, phraseHits.length * 2) * (adjacent ? 1.25 : 1) * legalWeight / (1 + 0.18 * Math.log(1 + entry.words.size));
    return [{entry, matches, phraseHits, score}];
  }).sort((a,b) => b.score-a.score);
  // A broad benefit label cannot replace a rare, independently attested condition.
  if (direct?.broad || statuteDetail) {
    const conditions = [...raw].filter(([key]) => frequency.has(key) && idf(key) > 4)
      .sort(([a], [b]) => idf(b) - idf(a));
    const condition = conditions.find(([key, word]) => ranked.some(({entry}) =>
      isPrimary(entry.corpus, entry.fragment) && lemma(entry.words.get(key) ?? "") === lemma(word)));
    if (condition) {
      const [key] = condition;
      ranked = ranked.filter(({entry}) => entry.words.has(key));
    }
  }
  // A continuation can repeat the whole query yet describe a narrower exception. Prefer the
  // opening rule when it covers every matching word and phrase of the higher ranked chunk.
  const first = ranked[0];
  if (first && isPrimary(first.entry.corpus, first.entry.fragment) && !/^Art\.|^§/iu.test(first.entry.fragment.sourceText)) {
    const index = ranked.findIndex(hit => hit.entry.fragment.documentId === first.entry.fragment.documentId &&
      hit.entry.fragment.locator === first.entry.fragment.locator && /^Art\.|^§/iu.test(hit.entry.fragment.sourceText) &&
      first.matches.every(key => hit.matches.includes(key)) && first.phraseHits.every(phrase => hit.entry.phrases.has(phrase)));
    if (index > 0) ranked.unshift(...ranked.splice(index, 1));
  }
  const best = ranked[0];
  if (!best || best.score < 4.5 || best.matches.length < input.length * 0.25) return unknownCondition;
  if (variants.some(variantsForWord => variantsForWord.length === 0)) {
    if (unknownCondition && best.matches.length * 2 < input.length) return unknownCondition;
    // A dropped condition and an accidental stem collision must not corroborate each other.
    // Require the same dictionary lemma in at least one term occurring in <5% of fragments.
    const preservesCondition = best.matches.some(key => {
      const word = raw.get(key);
      return word && frequency.get(key)! * 20 < entries.length && lemma(word) === lemma(best.entry.words.get(key)!);
    });
    if (!preservesCondition) return {
      corpus: best.entry.name, question: "", clarify: "Którą okoliczność mamy sprawdzić? Spróbuj opisać ją innymi słowami.",
    };
  }
  const rival = ranked.find(hit => hit.entry.fragment.fragmentSha256 !== best.entry.fragment.fragmentSha256 &&
    !(hit.entry.fragment.documentId === best.entry.fragment.documentId && hit.entry.fragment.locator === best.entry.fragment.locator));
  if (rival && best.score < rival.score * 1.055) return unknownCondition;
  // A reviewed plan wins unless it discards a distinctive condition that the corpus covers.
  if (direct?.locators?.length || direct?.corpus === "marta") {
    if (!direct.broad && direct.locators?.length && direct.corpus === best.entry.name && relevantFragment(direct, best.entry.corpus)(best.entry.fragment)) return null;
    const newConditions = best.matches.filter(key => isExtra(key) && raw.has(key));
    if (newConditions.length < (anchors.length && !direct.broad ? 2 : 1)) return unknownCondition;
  }
  const strongest = best.matches.sort((a,b) => idf(b)-idf(a)).slice(0, 8);
  const publicWords = [...best.entry.words].filter(([key]) => strongest.includes(key)).map(([,word]) => word);
  if (asksAboutOwnEligibility(text)) return {corpus:best.entry.name, question:"", clarify:"Czy chcesz poznać ogólną zasadę, czy sprawdzić uprawnienie na podstawie dokumentów swojej sprawy?"};
  const lexical = ranked.slice(0, 20).map(({ entry: { fragment } }) => ({
    corpusVersion: fragment.corpusVersion, logicalId: fragment.logicalId, fragmentSha256: fragment.fragmentSha256,
  }));
  return {corpus:best.entry.name, question:query(kind, publicWords), searchText:publicWords.join(" "), fragmentId:best.entry.fragment.logicalId, lexical};
}

// Resolve a topic-free facet only against the previous cited, still active public passage.
export function corpusFollowUp(text: string, previous: AskTurn | undefined): PublicQuestion | null {
  if (!previous?.publicQuery?.includes(separator) || previous.status !== "answered") return null;
  const kind = intent(text);
  // Only inherit the subject for a short, topic-free reference. Extra nouns can change a case.
  const remaining = text.toLocaleLowerCase("pl").replace(/[?!.]/g, "").split(/\s+/u).filter(Boolean);
  const reference = /^(?:a|i|czy|to|ten|tę|tej|tego|tym|taki|taką|takie|takim|muszę|mam|się|jest|ma|są|być|kto|co|od|do|jak|jaki|jakie|który|na|w|z|za|przez|ile|dni|wtedy|dokładnie|czym|czego|długo|potrwa|trwa|musi|mi|może|można|kiedy|gdzie|zrobić|potrzebne|otrzymać|przedstawić|zebrać|złożyć|wykazać)$/u;
  const hasNewSubject = kind === "info" || remaining.some(word => !reference.test(word) &&
    !/^(?:procent|stawk|okres|okolicznoś|sytuacj|świadczeni|stwierdz|potwierdz|poświadcz|zaświadcz|dowod|dowód|udowod|płac|wypłac|obowiąz|termin|dokument|przygotow|prawomoc|lekarz|lekars|ubezpiec|pracodawc)/u.test(word));
  for (const name of corpusNames) {
    const corpus = loadCorpus(name);
    if (corpus.manifest.corpusVersion !== previous.corpusVersion) continue;
    for (const citation of previous.citations) {
      const fragment = corpus.fragments.get(citation.fragmentId);
      const words = fragment && corpusKeywords(previous.publicQuery, fragment);
      if (!fragment || !words) continue;
      if (hasNewSubject) {
        // Reuse the prior subject only when the new qualification independently identifies a sibling of the cited unit.
        const candidate = searchCorpus(text);
        const next = candidate?.fragmentId && candidate.corpus === name && corpus.fragments.get(candidate.fragmentId);
        return next && next.documentId === fragment.documentId && next.locator === fragment.locator ? candidate : null;
      }
      // A new facet can live in another article, so search again with the previous *public* subject.
      const subject = words.join(" ");
      const reranked = searchCorpus(subject, null, kind, fragment.documentId) ?? searchCorpus(subject, null, kind);
      if (reranked) return reranked;
      if (facetEvidence[kind].test(fragment.sourceText)) {
        return {corpus:name, question:query(kind, words), searchText:words.join(" "), fragmentId:fragment.logicalId};
      }
      return {corpus:name, question:previous.publicQuery, uncovered:"W dostępnych fragmentach o tej sprawie nie znajduję potwierdzenia tego szczegółu."};
    }
  }
  return null;
}
