import type { Fragment } from "./corpus";
import { loadCorpus } from "./corpus-fs";
import { corpusKeywords, type searchCorpus } from "./corpus-search";
import { reviewedSourceIds } from "./excerpt";
import { asksAboutOwnEligibility, offerDocuments, projectPublicPair, publicPairPrefix, publicBenefitTopics, publicQuestion, type PublicQuestion } from "./public-query";
import { MAX_QUESTION_LENGTH, scopeGate } from "./query";

type Search = typeof searchCorpus;
type Facet = NonNullable<Parameters<Search>[2]>;
const facets: [RegExp, Facet, RegExp, string][] = [
  [/ile części|na części|podziel|podział/iu, "info", /częś(?:ci|ciach)/iu, "Na ile części można podzielić okres?"],
  [/w jakiej formie|papier|przez internet|jak złożyć|(?:jaki\p{L}* )?kanał|elektroniczn|jak wysłać/iu, "info", /elektroniczn|papierow|bankowoś/iu, "W jakiej formie można złożyć wniosek?"],
  [/jak długo|ile (?:dni|tygodni|miesięcy)|na jaki okres|od kiedy do kiedy.{0,30}okres świadczeniowy/iu, "duration", /(?:\d+|dwóch|trzech|dwunastu)\s*(?:dni|miesi|tygodni)|od \d+.{0,35}do \d+/iu, "Przez jaki okres?"],
  [/w jakim terminie|termin|do kiedy|od kiedy|ile wcześniej|jak wcześnie/iu, "deadline", /termin|(?:od|do) \d|dni przed|najpóźniej/iu, "Jaki termin obowiązuje?"],
  [/jaki\p{L}* (?:dokument|załącznik|formularz)|co (?:należy |trzeba )?dołączyć|dokumenty/iu, "documents", /dokument|zaświadczen|odpis|formularz/iu, "Jaki dokument jest wymagany?"],
  [/jaki procent|jak[ai] stawk|procent podstawy/iu, "rate", /\d\s*(?:%|proc)/iu, "Jaki procent podstawy wymiaru?"],
  [/kto (?:to )?(?:potwierdz|stwierdz|orzeka|poświadcz)|jak (?:to )?(?:potwierdz|udowod|wykazać|dowieść)|dowodem/iu, "proof", /orzecz\p{L}* (?:sądu|lekarz)|orzeka lekarz|potwierdza|stwierdza|zaświadczenie/iu, "Kto potwierdza tę okoliczność?"],
  [/przysługu|ma prawo|zachowuje prawo|traci prawo|uprawnia|warunki/iu, "entitlement", /przysług|prawo do|prawa do|uprawnion/iu, "Jakie są warunki prawa do świadczenia?"],
];
const facetOf = (text: string) => facets.find(([question]) => question.test(text));
const programmeDetail: typeof facets[number] = [/./u, "info", /./u, "Co wynika ze źródła?"];
const separator = /\s+(?:i|oraz|a)\s+(?=jak|kto|komu|kiedy|czy|do kiedy|od kiedy|ile|na ile|w jaki|przez ile|na jaki|któ|co )/iu;
const missing = (): PublicQuestion => ({
  corpus:"publiczne", question:"", clarify:"Nie udało mi się potwierdzić obu części pytania. Zapytaj osobno o każdy z tych szczegółów.",
});

// Every additional condition in a clause must occur in the selected public passage or its reviewed question.
const scaffolding = /^(?:kiedy|jak|któr|komu|ktos|czy|jakim|przysług|zachow|prawo|traci|upraw|ubezpiecz|świadczeni|zasił|tego|tych|takie|okoliczno|sytuac|musi|muszę|jest|koniecz|powin|trzeba|należ|moż|jaki|wymag|chodzi|warunk|potwierdz|stwierdz|udowod|wykaza|dowie|poświa|termin|dług|form|kanał|skład|złoż|złoży|dokument|załącz|dołącz|stawk|proce|miesiąc|miesięc|trwa|obejm|podzia|podzie|częś|okres|obowi|przewid|wypła|przez|oraz|wynik|zasad|dostaj|wtedy|ogóln)/u;
function covered(clause: string, publication: string) {
  const words = publication.toLocaleLowerCase("pl").match(/\p{L}{4,}/gu) ?? [];
  const application = /wnio(?:sek|sk)/iu.test(clause) && /złoż|składa/iu.test(publication);
  return (clause.toLocaleLowerCase("pl").match(/\p{L}{4,}/gu) ?? []).every(word =>
    scaffolding.test(word) || (application && /^(?:wysła|przesła)/u.test(word)) ||
    (word.startsWith("internet") && /elektroniczn/iu.test(publication)) || words.some(known => known.startsWith(word.slice(0, 4))));
}

export function compoundQuestion(text: string, search: Search): PublicQuestion | null {
  if (text.length > MAX_QUESTION_LENGTH || /(?<!\p{L})(?:lub|albo|zamiast|mój|moja|moim|mojej|naszym)(?!\p{L})|załączon|moim załączniku|@|\d{5}/iu.test(text) ||
      asksAboutOwnEligibility(text) || /\d|(?<!\p{L})(?:bez|nie|ani|oprócz)(?!\p{L})/iu.test(text.replace(/(?:800|300)\s*(?:\+|plus)/giu, ""))) return null;
  const transported = text.startsWith(publicPairPrefix);
  const rawClauses = transported ? text.slice(publicPairPrefix.length).split(/(?<=\?) oraz /u) : text.split(separator);
  if (rawClauses.length !== 2) return transported ? missing() : null;
  const original = publicQuestion(text);
  if (!transported && original?.question === text && reviewedSourceIds(original, loadCorpus(original.corpus)).length) return null;
  const pair = projectPublicPair(text);
  if (transported && pair?.question !== text) return missing();
  const clauses = pair?.question ? pair.question.slice(publicPairPrefix.length).split(/(?<=\?) oraz /u) : rawClauses;
  const [left, right] = clauses;
  const first = facetOf(left) ?? (pair?.question ? programmeDetail : undefined);
  const second = facetOf(right) ?? (pair?.question ? programmeDetail : undefined);
  if (!first && !second) return null;
  if (!first || !second || first === second) return missing();
  const programmes = offerDocuments.filter(([pattern]) => pattern.test(text));
  const leftTopics = publicBenefitTopics(left), rightTopics = publicBenefitTopics(right);
  if (programmes.length > 1 || (leftTopics.length && rightTopics.length && !leftTopics.some(topic => rightTopics.includes(topic)))) return missing();
  if (scopeGate(text.replace(/800\s*(?:\+|plus)/giu, ""))) return null;
  const programme = programmes[0];
  const targets: {plan:PublicQuestion; fragments:Fragment[]}[] = [];
  for (const [i, aspect] of [first, second].entries()) {
    const clause = clauses[i];
    const subject = programme && !programme[0].test(clause) ? clause + " " + programme[2] : clause;
    const direct = i === 1 && !programme && !rightTopics.length ? null : publicQuestion(subject);
    const scope = programme ? {corpus:"oferta" as const, question:""} : null;
    const citedDocument = i === 1 && !programme ? targets[0].fragments[0].documentId : undefined;
    const ranked = search(citedDocument ? text : subject, scope, aspect[1], citedDocument);
    const reviewed = direct && !direct.broad && (facetOf(direct.question) === aspect ||
      (!programme && direct.locators?.length && publicBenefitTopics(subject).length === 1)) &&
      reviewedSourceIds(direct, loadCorpus(direct.corpus)).length > 0 ? direct : null;
    let target;
    const whole = original && !original.broad && reviewedSourceIds(original, loadCorpus(original.corpus)).length ? original : null;
    for (const plan of [reviewed, targets[0]?.plan, ranked, whole]) {
      if (!plan?.question) continue;
      const corpus = loadCorpus(plan.corpus);
      const ids = plan.fragmentId ? [plan.fragmentId] : reviewedSourceIds(plan, corpus);
      const fragments = ids.flatMap(id => corpus.fragments.get(id) ?? []);
      if (!fragments.length || fragments.length !== ids.length) continue;
      if (plan === ranked && (!plan.fragmentId || !corpusKeywords(plan.question, fragments[0]))) continue;
      if (aspect === programmeDetail && plan !== ranked) continue;
      const source = fragments.map(f => f.sourceText).join(" ");
      const condition = programme ? rawClauses[i].replace(programme[0], "") : rawClauses[i];
      if (!aspect[2].test(source) || !covered(condition, source + " " + fragments[0].context + " " + plan.question)) continue;
      target = {plan, fragments};
      break;
    }
    if (!target) return missing();
    targets.push(target);
  }
  const fragments = targets.flatMap(target => target.fragments);
  const anchor = fragments[0];
  const sameVersion = fragments.every(f => f.corpusVersion === anchor.corpusVersion);
  const sameDocument = fragments.every(f => f.documentId === anchor.documentId);
  const sameProgramme = programme && fragments.every(f => f.documentId === programme[1] ||
    (f.documentId === "katalog-zus" && programme[0].test(f.context)));
  if (!sameVersion || (!sameDocument && !sameProgramme)) return missing();
  const lexical = [...new Map(fragments.map(f =>
    [f.logicalId, {logicalId:f.logicalId, corpusVersion:f.corpusVersion, fragmentSha256:f.fragmentSha256}])).values()];
  if (lexical.length > 5) return missing();
  const instructions = targets.flatMap(({plan}, i) => {
    const aspect = i === 0 ? first : second;
    return aspect === programmeDetail || facetOf(plan.question) === aspect ? [plan.question] :
      [aspect[3], plan.searchText ?? plan.question];
  });
  const searchText = [...new Set(instructions)].join(" ");
  if (searchText.length > MAX_QUESTION_LENGTH) return missing();
  return {corpus:targets[0].plan.corpus, question:pair?.question || searchText, searchText, fragmentId:anchor.logicalId,
    requiredFragmentIds:lexical.map(f => f.logicalId), lexical};
}
