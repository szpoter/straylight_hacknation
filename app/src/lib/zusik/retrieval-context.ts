import { asksAboutOwnEligibility, publicQuestion, type PublicQuestion } from "../rag/public-query";
import { suggestSubmissionFacet } from "./topic-ranker";
import type { AskTurn } from "./types";
import { sourceIntent } from "./context-answer";

// Read a subject from the previous public search, not from model prose or a private form.
const subjects: ReadonlyArray<readonly [RegExp, string]> = [
  [/rehabilitacyj/iu, "świadczenie rehabilitacyjne"],
  [/dobry start|300\s*(?:\+|plus)|wyprawk/iu, "Dobry Start"],
  [/800\s*(?:\+|plus)|świadczenie wychowawcze/iu, "800+"],
  [/aktywny rodzic|aktywnie w|żłobk|babciow/iu, "Aktywny Rodzic"],
  [/ojcowsk|\bZAM\b/iu, "urlop ojcowski"],
  [/rodzicielsk/iu, "urlop rodzicielski"],
  [/opiekuńcz/iu, "zasiłek opiekuńczy"],
  [/wyrównawcz/iu, "zasiłek wyrównawczy"],
  [/chorobow|zwolnienie lekarskie|e-zla/iu, "zasiłek chorobowy"],
  [/macierzyńsk/iu, "zasiłek macierzyński"],
  [/wychowawcz/iu, "urlop wychowawczy"],
  [/studen|uczeln/iu, "ubezpieczenie studenta"],
];

function topicOf(plan: PublicQuestion): string | undefined {
  return subjects.find(([pattern]) => pattern.test(plan.question))?.[1] ??
    (plan.corpus === "marta" ? "urlop rodzicielski" : undefined);
}

const facets: ReadonlyArray<readonly [RegExp, string]> = [
  [/do kiedy|najpóźniej|ostatni.*(?:dzień|moment)|ile wcześniej|termin|do którego|zdąży/iu, "termin złożenia wniosku"],
  [/którędy|jak (?:mam |mogę )?(?:to |go )?(?:wysłać|złożyć|załatwić)|gdzie|kanał|portal|online|internet|elektroniczn|pocztą|osobiście|aplikacj/iu, "sposób złożenia wniosku"],
  [/dokument|załącz|dołącz|formularz|odpis|papiery|co (?:mam |trzeba )?(?:wysłać|złożyć|przygotować)/iu, "potrzebne dokumenty"],
  [/jak długo|potrwa|trwa|maksymaln|ile (?:dni|miesi|tygod)|okres|na długo/iu, "jak długo"],
  [/procent|stawk|wysokoś|ile.{0,22}(?:płac|wypłac|wynosi)|pieniędzy|płacą|wypłacają/iu, "procent podstawy wymiaru"],
  [/komu|dla kogo|warun|kto (?:może|dosta)|przysług/iu, "warunki"],
];

const coverage: Record<string, RegExp> = {
  "termin złożenia wniosku": /termin|wcześniej|kiedy.{0,40}(?:składa|złożyć)/iu,
  "sposób złożenia wniosku": /kanał|elektroniczn|sposób (?:składa|złożenia)/iu,
  "potrzebne dokumenty": /dokument|załącz|dołącz/iu,
  "jak długo": /jak długo|jak długi|do jakiego wieku|wymiar|ile tygodni/iu,
  "procent podstawy wymiaru": /procent|stawka/iu,
};

// Only a topic-free follow-up may inherit the subject; a new noun with unclear meaning needs clarification.
const connectiveWords = new Set(("a i ale to tego jej jego tej ta tym takim tak wtedy ten teraz jeszcze dokładnie właściwie ogóle czy ile co " +
  "do od na przy się też za w we go je jeśli już z żeby mam trzeba mi mnie dla kogo komu kto jest są oraz bez po przez " +
  "tam tu u o chodzi jestem pracuję kiedy gdzie moment dni dzień osobiście online").split(" "));
const followUpStems = ("jak musi musz mog moż będ potrzeb zło skład dostarcz wys przes załatw przygot przynie wnios pobier dost przysług " +
  "obowiąz świadczeni zasił urlop tygod miesi okres potrwa trwa maksymal dług któr termin najpóź wcześ ostatni zdąży " +
  "wysokoś procent stawk wynosi wypłac płac pieniędz załącz dołącz formularz odpis dokument papier warun kanał portal " +
  "internet elektroniczn poczt aplikacj pracowni eta pracodawc działalnoś firm prowadz przedsiębior").split(" ");

export function resolveFollowUp(text: string, history: AskTurn[],
  suggestTopic?: (text: string) => PublicQuestion | null,
  hasOpeningTopic = false,
): { plan: PublicQuestion; requestId: string | null; needsTopic?: boolean } | null {
  const words = text.toLocaleLowerCase("pl").normalize("NFC").match(/[\p{L}\p{N}]+/gu) ?? [];
  if (!words.length) return null;
  const namedSubjects = subjects.flatMap(([pattern]) => {
    const match = pattern.exec(text);
    return match ? [match] : [];
  }).sort((a, b) => a.index - b.index);
  if (namedSubjects.length > 1 && namedSubjects.some((m, i) => i > 0 &&
      /\b(?:czy|albo|lub|versus)\b/iu.test(text.slice(namedSubjects[i - 1].index + namedSubjects[i - 1][0].length, m.index)))) {
    return { plan: { corpus: "publiczne", question: "", clarify: "O które ze wskazanych świadczeń chcesz najpierw zapytać?" }, requestId: null };
  }
  // Explicit new topics and sensitive qualifications take the standalone route.
  if (namedSubjects.length || /podatk|pogrzeb|kredyt|aliment|emerytur|rentow|składk|hospitaliz|przysposob|adopcj|ubezpiecz|\d/iu.test(text)) return null;
  const previous = history.findLast(turn => turn.status !== "conversation" && !sourceIntent(turn.question));
  const topicFree = words.every(word => connectiveWords.has(word) || followUpStems.some(stem => word.startsWith(stem)));
  const semanticFacet = (previous || hasOpeningTopic) && !topicFree ? suggestSubmissionFacet(text) : null;
  // An unknown noun may name a different subject. The local facet classifier can recognise
  // a delivery/deadline paraphrase; a weak interpretation must not select a statute.
  if (!topicFree && !semanticFacet) {
    if (previous && !publicQuestion(text)) {
      const newTopic = suggestTopic?.(text);
      if (newTopic) return { plan: newTopic, requestId: null };
    }
    if (previous && /^(?:a |i |da się |czy da się )/iu.test(text) && !publicQuestion(text)) {
      return { plan: { corpus: "publiczne", question: previous.publicQuery ?? "",
        clarify: "Doprecyzujesz, o co pytasz i którego świadczenia to dotyczy?" }, requestId: previous.requestId };
    }
    return null;
  }
  const facet = semanticFacet ?? facets.find(([pattern]) => pattern.test(text))?.[1];
  const role = /etat|etacie|pracowni|pracodawc/iu.test(text) ? "pracownik" :
    /firm|działalnoś|przedsiębior/iu.test(text) ? "przedsiębiorca" : undefined;
  if (!facet && !role && !/^(?:a |i )?(?:ile|kiedy|jak|co z tym|co dalej)\s*[?!]*$/iu.test(text.trim())) return null;
  const priorInput = previous?.publicQuery || previous?.question;
  const prior = priorInput ? publicQuestion(priorInput) : null;
  if (prior && previous?.publicQuery) prior.question = previous.publicQuery;
  const topic = prior && topicOf(prior);
  const clarify = (message: string) => ({
    plan: { corpus: prior?.corpus ?? "publiczne", question: prior?.question ?? "", clarify: message },
    requestId: previous?.requestId ?? null,
  });
  if (!topic || !prior || (previous?.status === "insufficient_evidence" && !previous.publicQuery)) {
    // Keep the established purpose clarification when a parent asks what to send with no prior turn.
    if (!previous && !hasOpeningTopic && /(?<![\p{L}])(?:co|jakie)(?![\p{L}]).*(?:wysłać|wyslac|złożyć)/iu.test(text)) return null;
    return { ...clarify("Które świadczenie albo jaki urlop masz na myśli?"), needsTopic: !previous };
  }
  if (asksAboutOwnEligibility(text)) return clarify(`Chcesz sprawdzić własne uprawnienie w sprawie „${topic}”? Opisz, z jakiego tytułu składasz wniosek.`);
  if (!facet && !role) return clarify(`W sprawie „${topic}” pytasz o czas trwania, termin wniosku czy wysokość świadczenia?`);
  const qualifier = role ?? (/przedsiębior|niebędąc|działalnoś/iu.test(prior.question) ? "przedsiębiorca" :
    /pracowni|pracodawc|etacie/iu.test(prior.question) ? "pracownik" : "");
  const search = facet ?? facets.find(([pattern]) => pattern.test(prior.question))?.[1] ?? "";
  const details = topic === "urlop rodzicielski" && search === "sposób złożenia wniosku" ? "złożyć elektronicznie" :
    topic === "urlop rodzicielski" && search === "jak długo" ? "ile tygodni" : search;
  const publicAmount = ["Dobry Start", "800+"].includes(topic) && search === "procent podstawy wymiaru";
  const plan = publicQuestion(`${topic} ${qualifier} ${publicAmount ? "kwota" : details}`);
  if (!plan || (!plan.clarify && (topicOf(plan) !== topic ||
      (!publicAmount && coverage[search] && !coverage[search].test(plan.question))))) {
    return { plan: { corpus: prior.corpus, question: prior.question,
      uncovered: `Rozmawiamy o „${topic}”. Nie znajduję pewnej odpowiedzi na to dodatkowe pytanie w dostępnych materiałach.` },
      requestId: previous?.requestId ?? null };
  }
  return { plan, requestId: previous?.requestId ?? null };
}
