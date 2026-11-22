import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { relevantFragment } from "./relevance";
import { isPrimary, isValidOn, type Corpus, type Fragment } from "./corpus";
import { corpusNames, loadCorpus } from "./corpus-fs";
import { asksAboutOwnEligibility, offerDocuments, type PublicQuestion } from "./public-query";
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
function terms(text: string) {
  const words = new Map<string, string>();
  for (const word of text.toLowerCase().match(/[a-ząćęłńóśźż]{4,}/gu) ?? []) {
    if (!stop.has(word)) {
      const key = fold(lemma(word)).slice(0, 5);
      if (!words.has(key)) words.set(key, word);
    }
  }
  return words;
}

const intents = {
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
  if (/procent|stawka|stawki/iu.test(text)) return "rate";
  if (/komu|kto.{0,20}(?:odbiera|otrzyma|dostaje)/iu.test(text)) return "recipient";
  if (/poświadcz|potwierdz|stwierdz|udowod|dowodem|dowieść|zaświadcz/iu.test(text)) return "proof";
  if (/jak długo|na jak długo|przez ile|ile (?:dni|tygodni|miesięcy)|jak dług[io]|jaki okres/iu.test(text)) return "duration";
  if (/do kiedy|ile czasu na|termin|kiedy najpóźniej/iu.test(text)) return "deadline";
  if (/dokument|załącz|dołącz|papiery/iu.test(text)) return "documents";
  if (/kto.{0,20}(?:płaci|wypłac)/iu.test(text)) return "payer";
  if (/można (?:otrzym|pobier)|przysługuje|(?:zachowuje|traci|ma) prawo do/iu.test(text)) return "entitlement";
  return "info";
}

const facetEvidence: Record<Exclude<Intent,"info">, RegExp> = {
  entitlement: /przysług|(?:prawo|prawa) do|uprawnion/iu,
  duration: /dni|dnia|dzień|tygodni|miesię|miesią|przez|okres|lat\b|rok/iu,
  deadline: /termin|do dnia|w ciągu|najpóźniej|wcześniej/iu,
  payer: /wypłac|płatni/iu,
  documents: /dokument|wniosek|odpis|załącz|zaświadczeni/iu,
  rate: /%|procent/iu,
  recipient: /wypłaca się|osob(?:ie|om) uprawnion/iu,
  proof: /stwierdz|potwierdz|orzecze|zaświadcze|dowod|dowód/iu,
};
function query(kind: Intent, words: string[]) {
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

type Entry = { name: typeof corpusNames[number]; corpus: Corpus; fragment: Fragment; words: Map<string, string> };
function buildIndex() {
  const entries: Entry[] = [];
  const frequency = new Map<string, number>();
  for (const name of corpusNames) {
    const corpus = loadCorpus(name);
    for (const fragment of corpus.fragments.values()) {
      const words = terms(fragment.sourceText);
      for (const key of words.keys()) frequency.set(key, (frequency.get(key) ?? 0) + 1);
      entries.push({ name, corpus, fragment, words });
    }
  }
  return { entries, frequency };
}
let cached: ReturnType<typeof buildIndex> | undefined;

export function searchCorpus(text: string, direct?: PublicQuestion | null, kind = intent(text)): PublicQuestion | null {
  const {entries, frequency} = cached ??= buildIndex();
  const scopes = direct?.corpus === "oferta" ? offerDocuments.filter(([name]) => name.test(text)) : [];
  const scope = scopes.length === 1 ? scopes[0] : undefined;
  if (direct?.corpus === "oferta" && !scope) return null;
  const raw = terms(scope ? text.replace(scope[0], "") : text);
  const input = [...raw.keys()];
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
  const ranked = entries.flatMap(entry => {
    if (scope && entry.fragment.documentId !== scope[1]) return [];
    if (!isValidOn(entry.corpus, entry.fragment, day) || (kind !== "info" && !facetEvidence[kind].test(entry.fragment.sourceText))) return [];
    const weights = new Map<string, number>();
    for (let i = 0; i < variants.length; i++) {
      const key = variants[i].find(k => entry.words.has(k));
      if (key) weights.set(key, Math.max(weights.get(key) ?? 0, key === input[i] ? 1 : 0.45));
    }
    const matches = [...weights.keys()];
    const exact = matches.filter(key => weights.get(key) === 1);
    if (matches.length < 2 || !exact.length || !matches.some(key => idf(key) > 3.3)) return [];
    const positions = [...entry.words.keys()].flatMap((key, index) => matches.includes(key) && idf(key) > 2 ? [index] : []);
    const adjacent = positions.some((at,i) => i > 0 && at - positions[i-1] <= 4);
    // For legal conditions, prefer the provision over a form or guide which restates its vocabulary.
    const legalWeight = ["entitlement", "rate", "proof"].includes(kind) && isPrimary(entry.corpus, entry.fragment) ? 1.15 : 1;
    const score = matches.reduce((sum,key) => sum + idf(key) * weights.get(key)!, 0) * (adjacent ? 1.25 : 1) * legalWeight / (1 + 0.18 * Math.log(1 + entry.words.size));
    return [{entry, matches, score}];
  }).sort((a,b) => b.score-a.score);
  const best = ranked[0];
  if (!best || best.score < 4.5 || best.matches.length < input.length * 0.25) return unknownCondition;
  if (variants.some(variantsForWord => variantsForWord.length === 0)) {
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
  if (direct) {
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
    !/^(?:okres|okolicznoś|sytuacj|świadczeni|stwierdz|potwierdz|poświadcz|zaświadcz|dowod|dowód|udowod|płac|wypłac|obowiąz|termin|dokument|przygotow|prawomoc|lekarz|lekars|ubezpiec|pracodawc)/u.test(word));
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
      const reranked = searchCorpus(words.join(" "), null, kind);
      if (reranked) return reranked;
      if (facetEvidence[kind].test(fragment.sourceText)) {
        return {corpus:name, question:query(kind, words), searchText:words.join(" "), fragmentId:fragment.logicalId};
      }
      return {corpus:name, question:previous.publicQuery, uncovered:"W dostępnych fragmentach o tej sprawie nie znajduję potwierdzenia tego szczegółu."};
    }
  }
  return null;
}
