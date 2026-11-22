import { explicitLocatorKeys, MAX_QUESTION_LENGTH, scopeGate } from "./query";
import vocabulary from "./public-legal-vocabulary.json";
import type { CorpusCandidate } from "./retrieve";

// Only these prewritten public questions can reach hosted inference. Uploaded
// documents, identities and free-form explanations stay outside the search prompt.
export interface PublicQuestion {
  corpus: "marta" | "publiczne" | "oferta";
  question: string;
  locators?: string[];
  fragmentId?: string;
  /** A single provision answers all requested aspects when quoted together. */
  quoteProvision?: string;
  /** Source units needed for independently identified aspects of one public question. */
  requiredFragmentIds?: string[];
  lexical?: CorpusCandidate[];
  /** This catch-all identifies a broad subject and can miss a more specific provision. */
  broad?: boolean;
  /** Source words for vector search, without the generation instruction. */
  searchText?: string;
  clarify?: string;
  /** A recognised follow-up for which the curated material has no matching search. */
  uncovered?: string;
}

const sickness = /chorob|zwolnien|niezdolno|ubezpiecze|e-zla|składk|zleceni|samozatrud|działalno|przedsiębior/iu;
const paternity = /ojcowsk|\bzam\b/i;
const period = /termin|kiedy|wcześniej|start|przed\s|najpóźniej/iu;

// "Zwolnienie" alone can mean dismissal or an exemption. A medical qualifier
// or an ongoing leave period identifies sickness in the absence of a benefit name.
const sickLeave = /chorobow|\be[-‑]?zla\b|\bl[- ]?4\b|niezdoln\p{L}* do pracy|zwolnieni\p{L}* (?:lekarsk|chorobow)|(?:na|podczas|w (?:trakcie|czasie|okresie)) zwolnieni\p{L}*(?!\p{L}| (?:z|ze) )/iu;
const benefitPatterns = {
  sickness: sickLeave,
  care: /zasił\p{L}* opiekuńcz|opie[kc]\p{L}* nad chor\p{L}* (?:dzieck|członk)/iu,
  maternity: /(?:macierzyńsk|macierzyństw)/iu,
  paternity,
  parental: /urlop\p{L}* rodzicielsk/iu,
  rehabilitation: /świadcze\p{L}* rehabilitacyjn/iu,
  compensatory: /zasił\p{L}* wyrównawcz/iu,
  "800-plus": /800\s*(?:\+|plus)|świadczeni\p{L}* wychowawcz/iu,
  "dobry-start": /dobr(?:y|ego|ym) start|300\s*(?:\+|plus)/iu,
  "active-parent": /aktywn\p{L}* (?:rodzic|w (?:domu|żłobku))/iu,
} as const;

export type PublicBenefitTopic = keyof typeof benefitPatterns;

export function publicBenefitTopics(text: string): PublicBenefitTopic[] {
  return (Object.keys(benefitPatterns) as PublicBenefitTopic[]).filter(key => benefitPatterns[key].test(text));
}

const programmePeriodQuestion = "Od kiedy do kiedy trwa okres świadczeniowy 800+?";
const programmeOpeningQuestion = "Od kiedy można złożyć wniosek o 800+ na nowy okres?";
const programmeChannelQuestion = "Jakimi kanałami można złożyć wniosek o 800+?";
const programme800 = /800\s*(?:\+|plus)|świadczeni\p{L}* wychowawcz\p{L}*/iu;

function asksProgrammePeriod(text: string) {
  const rest = text.replace(programme800, "");
  if (!/(?:okres|rok|roku)\p{L}* świadczeniow|świadczeniow\p{L}* (?:okres|rok)/iu.test(rest)) return false;
  if (!/kiedy|dat|długo|trwa|począt|zaczyna|kończ|koniec|miesiąc|miesięc/iu.test(rest)) return false;
  // Whole-phrase coverage keeps application dates and individual circumstances on their own routes.
  return (rest.match(/\p{L}+/gu) ?? []).every(word =>
    /^(?:od|do|w|i|się|jak|dla|na|oraz|programu|kolejny|nowy|dany|jest|to|czy|kiedy|ile|rok|roku|latach)$/iu.test(word) ||
    /^(?:jak(?:i|ich)|któr|każd|okres|świadczeniow|miesiąc|miesięc|obejmuj|dat|długo|trwa|począt|zaczyna|kończ|koniec|końca)/iu.test(word));
}

function asksSubmissionOpening(text: string) {
  const rest = text.replace(programme800, "");
  if (!/od kiedy|kiedy można|początek naboru/iu.test(rest) || !/wnios|nab[oó]r/iu.test(rest) ||
      !/(?:nowy|kolejny) okres/iu.test(rest)) return false;
  return (rest.match(/\p{L}+/gu) ?? []).every(word =>
    /^(?:od|kiedy|można|już|początek|naboru|na|o|w|nowy|kolejny|okres|programu|do|zus)$/iu.test(word) ||
    /^(?:wnio|świadczeniow|złoży|skład|wysła|wysył|elektroniczn)/iu.test(word));
}

function asksSubmissionChannels(text: string) {
  const rest = text.replace(programme800, "");
  if (!/kanał|jakim sposobem|gdzie|którędy|w jakiej formie/iu.test(rest) || !/wnios|skład|złoż|wysła/iu.test(rest)) return false;
  return (rest.match(/\p{L}+/gu) ?? []).every(word =>
    /^(?:o|do|w|z|i|jak|jest|to|się|na|dla|przez|gdzie|mogę|mamy|którędy|programu)$/iu.test(word) ||
    /^(?:jakimi?|jakiej|kanał|sposob|formie|moż|wnio|skład|złoż|wysła|elektroniczn)/iu.test(word));
}

function routeTopic(input: string): PublicQuestion | null {
  const q = input.toLocaleLowerCase("pl").normalize("NFC");
  const generic = (question: string, locators?: string[]): PublicQuestion => ({ corpus: "publiczne", question, locators });
  const marta = (question: string): PublicQuestion => ({ corpus: "marta", question });
  if (/ulg[aięą]\s+rehabilitacyjn/u.test(q)) return null;

  const statute = q.match(/^(?:(?:co (?:stanowi|mówi|przewiduje) |co wynika z |(?:pokaż|zacytuj|przytocz) )?(?:art\.?|artykuł)\s*(\d{1,3}[a-z]?)(?:\s+ust\.?\s*(\d{1,2}))?\s+ustawy zasiłkowej)[?!. ]*$/u);
  if (statute) {
    const [, article, paragraph] = statute;
    return generic(`Co stanowi art. ${article}${paragraph ? " ust. " + paragraph : ""} ustawy zasiłkowej?`,
      paragraph ? [`uz:${article}:${paragraph}`, `uz:${article}`] : [`uz:${article}`]);
  }
  if (/\b(?:art\.?|artykuł\p{L}*)\s*\d/u.test(q) && /zasiłkow|chorobow|świadczeniach pieniężnych/u.test(q))
    return { ...generic(""), clarify: "Pytasz o treść jednego artykułu ustawy zasiłkowej czy o konkretny warunek świadczenia?" };

  const offer = (id: string, question: string): PublicQuestion => ({ corpus: "oferta", question, locators: ["program:" + id] });
  if (programme800.test(q)) {
    if (asksSubmissionOpening(q)) return offer("800-plus", programmeOpeningQuestion);
    if (asksSubmissionChannels(q)) return {corpus: "oferta", question: programmeChannelQuestion,
      requiredFragmentIds: ["of-800-6-2", "of-800-6-3"]};
    return offer("800-plus", asksProgrammePeriod(q) ? programmePeriodQuestion :
      "Jak ZUS opisuje program 800+ i kiedy można złożyć wniosek na nowy okres?");
  }
  if (/dobr(?:y|ego|ym) start(?:u|em)?|300\s*(?:\+|plus)|wyprawk/u.test(q)) {
    if (/do kiedy|od kiedy|termin|najpóźniej/u.test(q)) return offer("dobry-start:termin", "W jakim terminie można złożyć wniosek o świadczenie Dobry Start?");
    if (/sposób złożenia|którędy|gdzie|kanał|online|elektroniczn|bankowoś|mzus|przez co|jak.{0,15}(?:wysłać|złożyć)/u.test(q))
      return offer("dobry-start:kanaly", "Jakimi kanałami rodzic może złożyć elektroniczny wniosek o Dobry Start?");
    return offer("dobry-start", "Na czym polega świadczenie Dobry Start na wyprawkę szkolną?");
  }
  if (/aktywn[yaie]+ rodzic|aktywnie w|żłobk|babciow/u.test(q)) return offer("aktywny-rodzic", "Jakie świadczenia wymienia ZUS w programie Aktywny Rodzic?");
  const explicit = explicitLocatorKeys(q);
  if (explicit.length) return { ...marta(`Jakie zasady określa wskazany przepis: ${explicit.join(", ")}?`), locators: explicit };
  if (paternity.test(q)) {
    const selfEmployed = /działalno|przedsiębior|samozatrud|prowadzę firm|niebędąc|nie jestem pracownikiem/u.test(q);
    const employee = !selfEmployed && /pracowni|eta[tc]|pracodawc/u.test(q);
    if (!selfEmployed && !employee && (period.test(q) || /dokument|odpis|dołącz|załącz/u.test(q)) && !/wiek|miesi|ukończe/u.test(q)) {
      return { ...generic(/dokument|odpis|dołącz|załącz/u.test(q) ? "Dokumenty do wniosku o urlop ojcowski." : "Termin złożenia wniosku za okres ojcowskiego."), clarify: "Pytasz o urlop ojcowski na etacie czy o zasiłek za ten okres przy działalności?" };
    }
    if (/dokument|dołącz|odpis|akt urodzenia|załącz|doł[ąa]cz/iu.test(q))
      return employee ? generic("Jakie dokumenty dołącza pracownik do wniosku o urlop ojcowski u pracodawcy?", ["rw:17"]) : generic("Jakich dokumentów potrzebuje przedsiębiorca, aby wystąpić o zasiłek macierzyński za okres urlopu ojcowskiego?", ["rz:33:1"]);
    if (period.test(q) && !/wiek|miesięcy|miesiąc|rocz/iu.test(q))
      return employee
        ? generic("Kiedy pracownik składa do pracodawcy wniosek o urlop ojcowski?", ["kp:1823"])
        : generic("W jakim terminie ubezpieczony niebędący pracownikiem składa wniosek o zasiłek za okres urlopu ojcowskiego?", ["rz:33:1"]);
    if (/wiek|rok|miesi|częś|podziel|tydzie|tygod|ile dni|jak długo/iu.test(q))
      return generic("Do jakiego wieku dziecka i w ilu częściach można wykorzystać urlop ojcowski?", ["kp:1823:1"]);
    return generic("Jak wygląda wniosek ZAM o zasiłek macierzyński za okres urlopu ojcowskiego?", ["rz:33:1"]);
  }

  const afterSickness = /(?:wyczerp|wykorzyst|kończy|skończy).{0,45}(?:chorobow|okres zasiłkow)/u.test(q)
    && !/nie (?:wyczerp|wykorzyst|kończy|skończy)/u.test(q)
    && /(?:nadal|dalej|wciąż).{0,30}(?:nie mogę pracować|niezdoln|nie mogę wrócić do pracy)/u.test(q)
    && /(?:świadczeni|zasił|pieni[ąę]dz).{0,25}(?:dalsz|kolejn)|co dalej/u.test(q);
  const namedRehabilitation = /(?:świadcze\p{L}*|zasił\p{L}*)\s+rehabilitacyjn/u.test(q);
  if (afterSickness && !namedRehabilitation && (!/leczen|rehabilitac/u.test(q) || !/powr[oó][ct]|odzysk/u.test(q)
      || /(?:nie przewiduje|brak szans|nie rokuj|nie ma szans)/u.test(q))) {
    return { ...generic(""), clarify: "Chcesz poznać warunki świadczenia rehabilitacyjnego czy szukasz innego świadczenia po zakończeniu chorobowego?" };
  }
  if (namedRehabilitation || afterSickness) {
    if (/dokument|załącz|dołącz|formularz/u.test(q))
      return generic("Jakie dokumenty są potrzebne do świadczenia rehabilitacyjnego?", ["rz:11"]);
    if (/procent|stawk|podstaw[ayę] wymiaru|ile.{0,22}wypłac/u.test(q))
      return generic("Jaki procent podstawy wymiaru wynosi świadczenie rehabilitacyjne?", ["uz:19"]);
    if (/emeryt|rent[ęay]|bezrobotn|uprawnienia wyłączają/u.test(q))
      return generic("Jakie uprawnienia wyłączają prawo do świadczenia rehabilitacyjnego?", ["uz:18"]);
    if (/jak długo|ile (?:miesi|dni)|na jaki okres|maksymaln/u.test(q))
      return generic("Kiedy i na jak długo przysługuje świadczenie rehabilitacyjne?", ["uz:18"]);
    return generic("Kiedy przysługuje świadczenie rehabilitacyjne?", ["uz:18"]);
  }
  if (/po ustaniu|po zakończeniu|po rozwiązaniu|po zwolnieniu|skończyła się umowa|koniec umowy|umow.{0,14}(skończy|wygas)/iu.test(q))
    return generic("Kiedy można pobierać zasiłek chorobowy po ustaniu tytułu ubezpieczenia i jakie są wyłączenia?", ["uz:7", "uz:13:1"]);

  if (/w ciąż|ciąży|kod b/iu.test(q) && /procent|wysoko|stawk|100\s*%/iu.test(q))
    return generic("Jaki procent podstawy wymiaru wynosi zasiłek chorobowy w okresie ciąży i od czego zależy samo prawo?", ["uz:11:2", "uz:6:1"]);

  if (sickLeave.test(q) || /zwolnien|niezdolno/iu.test(q)) {
    if (/opie[kc]|chore.{0,8}dziec/iu.test(q)) return generic("Jak uzyskać zasiłek opiekuńczy na chore dziecko?");
    if (/wyczeki|jak długo.{0,25}ubezpie|od ilu dni|muszę (być|podlegać)|od kiedy/iu.test(q))
      return generic("Jak długi jest okres wyczekiwania na zasiłek chorobowy przy obowiązkowym i dobrowolnym ubezpieczeniu?", ["uz:4"]);
    if (/ile dni|jak długo|maksymaln|okres zasiłkowy/iu.test(q))
      return generic("Jak długi jest okres zasiłkowy w chorobie i w okresie ciąży?", ["uz:8"]);
    return { ...generic("Czy samo zwolnienie lekarskie wystarcza do zasiłku chorobowego i kiedy musi powstać niezdolność do pracy?", ["uz:6:1", "uz:7"]), broad: true };
  }
  if (/opiekuń|chore.{0,8}dziec/u.test(q)) return generic("Jakie dokumenty trzeba złożyć w sprawie zasiłku opiekuńczego na dziecko?");
  if (/wcześniak|uzupełniając|hospitaliz|szpital/u.test(q)) return generic("Kiedy rodzicom dziecka przysługuje uzupełniający urlop macierzyński?", ["kp:1802"]);
  if (/zdrowotn/u.test(q)) return generic("W jaki sposób rodzic lub opiekun podlega ubezpieczeniu zdrowotnemu?");
  if (/studen|ucze[ńn]|uczeln|szkoł/u.test(q)) return generic("Jak wygląda ubezpieczenie ucznia lub studenta zatrudnionego na podstawie umowy zlecenia?");
  if (/wychowawcz/u.test(q)) return generic("Jakim ubezpieczeniom podlega rodzic podczas urlopu wychowawczego?");
  if (sickness.test(q)) return generic("Które ubezpieczenia są obowiązkowe lub dobrowolne dla osoby prowadzącej pozarolniczą działalność i dla zleceniobiorcy?");
  if (/macierzyń/u.test(q) && !/rodzicielski/u.test(q)) return generic("W jakim wymiarze i za jaki okres przysługuje zasiłek macierzyński?", ["uz:29a"]);

  if (/wypoczynkow|pogrzebow|emerytur|kredyt|podat|aliment/u.test(q)) return null;
  if (/odpis|akt (urodzenia|dziecka)|w (aktach|teczce)|załącznik/u.test(q)) {
    if (/nie ma(?:ją)?|brak|nie posiad|nie przekaza|nie złoży/u.test(q)) return marta("Czy do wniosku o urlop rodzicielski dołączyć odpis aktu urodzenia, jeśli w aktach pracownika brakuje tego odpisu?");
    return marta(/nie wiem|nie mam pewności/u.test(q) ? "Nie wiadomo, czy kadry mają już odpis aktu urodzenia. Czy trzeba dołączyć kolejny odpis?"
      : /już|maj[ąa]|teczce|aktach|kolejn|ponown|drugi|znowu/u.test(q) ? "Kadry mają już odpis aktu urodzenia dziecka w aktach. Czy trzeba dołączyć kolejny odpis?" : "Jakie dokumenty dołączyć do wniosku o urlop rodzicielski?");
  }
  if (/wykorzystał|wykorzystan|poprzedni.{0,10}częś|skąd wiadomo/u.test(q)) return marta("Skąd wiadomo, ile części urlopu rodzicielskiego już wykorzystano?");
  if (/odda|przekaz|wyłączn|zarezerwowa|dziewięć|\b9\b/u.test(q)) return marta("Czy 9 tygodni urlopu rodzicielskiego zarezerwowanych dla jednego rodzica można przekazać drugiemu?");
  if (/napisać o|wpisać|(?<!\p{L})oświadcz|o drugim|o niej|tym czasie.{0,24}(napisać|wnios)/u.test(q))
    return marta(/nie (bierze|korzysta|planuje)/u.test(q) ? "Co oświadczyć we wniosku, jeśli drugi rodzic nie korzysta z urlopu rodzicielskiego?" : "Co wpisać o drugim rodzicu, skoro też bierze urlop rodzicielski?");
  if (/zasił/iu.test(q) && /rodziciel/iu.test(q) && /w tym czasie|jednocze|wspólni|razem|może.*(?:urlop|korzystać)/iu.test(q)) {
    return { ...marta("Czy w okresie pobierania zasiłku macierzyńskiego za okres urlopu rodzicielskiego przez jednego rodzica drugi może korzystać z urlopu rodzicielskiego?"), locators: ["art182^1a§7"] };
  }
  if (/razem|jednocze|równocze|oboje|wspólni|samym (czasie|miesiącu)|tych samych|w tym czasie/u.test(q)) return marta("Czy oboje rodzice mogą być jednocześnie na urlopie rodzicielskim w tych samych tygodniach?");
  if (/pół etatu|niepełn\p{L}*\s+(?:wymiar|etat)|łącz.{0,20}prac/u.test(q)) return marta("Jak połączyć pracę na pół etatu z urlopem rodzicielskim i kiedy złożyć wniosek?");
  if (/rodzicielsk/u.test(q)) {
    const application = /wnios|złoż|złoży|składa/u.test(q);
    if (!application && /częś|kawał|podziel/u.test(q) && /do kiedy|wiek|roku życia|jak późno|najpóźniej/u.test(q))
      return { ...marta("Na ile części można podzielić urlop rodzicielski i do kiedy można go wykorzystać?"), quoteProvision:"kp-art182-1c" };
    if (application && /w jakim terminie|jaki (?:jest )?termin|do kiedy|kiedy (?:najpóźniej|trzeba|należy|mam|złożyć|składa)|ile wcześniej|wyprzedzeni|ile dni przed/u.test(q) &&
        /papier|elektroniczn|online|internet|w jakiej (?:formie|postaci)/u.test(q) && !/od kiedy|po terminie/u.test(q))
      return { ...marta("W jakim terminie można złożyć wniosek o urlop rodzicielski i czy dopuszczalna jest forma elektroniczna?"), quoteProvision:"kp-art182-1d-par1" };
  }
  if (/wysłać.{0,20}elektr|elektronicz|mailem|przez internet|online/u.test(q)) return marta("Czy wniosek do pracodawcy o urlop rodzicielski można złożyć elektronicznie?");
  if (/odmówi|odmowa/u.test(q)) return marta("Czy pracodawca może odmówić udzielenia urlopu rodzicielskiego po złożeniu wniosku w terminie?");
  if (/podziel|kawał|częś|ile razy/u.test(q)) return marta("Na ile części można podzielić urlop rodzicielski?");
  if (/do kiedy|wiek dziecka|do jakiego wieku/u.test(q)) return marta("Do jakiego wieku dziecka można wykorzystać urlop rodzicielski?");
  if (period.test(q) && /wniosek|wnios|urlop|kadr|szef|przed startem|złożyć/u.test(q)) return marta("Ile wcześniej i do kogo trzeba złożyć wniosek o urlop rodzicielski?");
  if (/ile tygodni/u.test(q) || (/wymiar/u.test(q) && /urlop|rodzicielsk/u.test(q))) return marta("Jak wymiar urlopu rodzicielskiego zależy od liczby dzieci urodzonych przy jednym porodzie?");
  if (/dokument|dołącz|załącz/u.test(q)) return marta("Jakie dokumenty dołączyć do wniosku o urlop rodzicielski?");
  if (/informacj|wnios|rodzicielski|pracodawc/u.test(q)) return marta("Jakie informacje należy zawrzeć we wniosku do pracodawcy o urlop rodzicielski?");
  return null;
}

// Topics outside the three decision workflows use vetted public terminology.
// Question type and qualifiers stay part of the search rather than being overwritten
// by an example family's situation. No arbitrary word from the input is transmitted.
const OTHER_TOPICS: ReadonlyArray<readonly [RegExp, string]> = [
  [/wyrównawcz/iu, "zasiłek wyrównawczy"], [/przedawni/iu, "przedawnienie roszczenia o wypłatę zasiłku"],
  [/zaległo|zadłuż/iu, "zadłużenie w opłacaniu składek na ubezpieczenia społeczne"],
  [/przysposob|adopcj/iu, "przysposobienie dziecka"], [/piecz[ayę] zastępcz/iu, "piecza zastępcza"],
  [/podstaw(?:[ayęą]|ie) wymiaru/iu, "podstawa wymiaru zasiłku"], [/podwójn|drug(?:a|iej) prac|drug(?:i|iego) tytuł/iu, "kilka tytułów ubezpieczenia"],
  [/opiekuń|opieki nad/iu, "zasiłek opiekuńczy"], [/porzuce/iu, "porzucenie dziecka przez matkę"],
  [/hospitaliz|szpital/iu, "pobyt dziecka w szpitalu"], [/wcześniak|przedwcześnie urodz/iu, "urodzenie dziecka przed terminem"],
  [/pół etatu|część etatu|niepełn\p{L}*\s+(?:wymiar|etat)/iu, "wykonywanie pracy w niepełnym wymiarze"],
];
export function asksAboutOwnEligibility(input: string): boolean {
  return /czy (?:mi |nam )(?:przysługuje|należy się)|czy (?:przysługuje|należy się) (?:mi|nam)\b|czy dostanę|czy mam prawo/iu.test(input);
}
export const offerDocuments = [
  [/800\s*(?:\+|plus)|świadczeni\p{L}* wychowawcz\p{L}*/iu, "zus-800", "800+"],
  [/aktywni rodzice w pracy/iu, "zus-praca", "Aktywni rodzice w pracy"],
  [/aktywnie w domu/iu, "zus-dom", "Aktywnie w domu"],
  [/aktywnie w żłobku/iu, "zus-aktywnie-w-zlobku", "Aktywnie w żłobku"],
  [/dobr(?:y|ego|ym) start(?:u|em)?|300\s*(?:\+|plus)/iu, "zus-dobry-start", "Dobry Start"],
] as const;

// Ordered by document frequency in the selected programme; canonical spellings
// and input prefixes come only from packaged public sources.
const programmeFacet = [
  [/do kiedy|najpóźniej|w jakim terminie|ile czasu|termin/iu, "Termin"],
  [/jak(?:ie|ich|i) (?:są |trzeba )?(?:dokument|załącznik|formularz)/iu, "Dokumenty"],
  [/jak długo|ile (?:dni|miesięcy)|na jaki okres/iu, "Jak długo"],
] as const;

const programmeTerms = Object.fromEntries(Object.entries(vocabulary.offerTerms).map(([doc, rows]) => {
  const terms = new Map<string, number>();
  const words = rows.map((row, rank) => {
    const [word, ...prefixes] = row.split(" ");
    for (const prefix of prefixes) terms.set(prefix, rank);
    return word;
  });
  // A transported phrase must reproduce itself even for a word with ambiguous prefixes.
  words.forEach((word, rank) => terms.set(word, rank));
  return [doc, {terms, words}];
}));

export function offerDetail(input: string, topic: PublicQuestion) {
  if (topic.corpus !== "oferta" || topic.question === input || topic.question === programmePeriodQuestion || topic.question === programmeOpeningQuestion || topic.requiredFragmentIds?.length) return topic;
  const matches = offerDocuments.filter(([pattern]) => pattern.test(input));
  if (matches.length !== 1) return topic;
  const [pattern, doc, name] = matches[0];
  const {terms, words} = programmeTerms[doc];
  const body = input.replace(pattern, "");
  const encoded = /^\. (Termin|Dokumenty|Jak długo) — (.+)\?$/u.exec(body);
  const facet = encoded?.[1] ?? programmeFacet.find(([match]) => match.test(body))?.[1];
  const ranks = new Set<number>();
  for (const token of contentWords(encoded?.[2] ?? body)) {
    if (/^(?:program|świadcz|wnios[ek]|przysług|jakie|jaki$|jakim|któr|chcia|dzień|witamy|prosz|jest$|jestem|było|możn|może|gdyby|jeżeli|jeśli|przez$|potrzeb|kiedy|termin|złoży|złoże|które|kanał)/u.test(token)) continue;
    let rank = terms.get(token);
    for (let length = 5; rank === undefined && length <= 8; length++) rank = terms.get(token.slice(0, length));
    if (rank !== undefined) ranks.add(rank);
  }
  const selected = [...ranks].sort((a, b) => a - b).slice(0, 8).map(rank => words[rank]);
  if (selected.length < 2) return topic;
  return {...topic, question: name + ". " + (facet ? facet + " — " : "") + selected.join(", ") + "?"};
}

const programmeWords = new Set((vocabulary.programmeStems +
  " cześć witam dzień dobry ogóln zasad powie wytłu wyjaś prosz pytam pytan dział" +
  " dotyc chodz chcia możli mógłb mogła przew najpó termi wybór wybra skład wysła złoży którę" +
  " jakim kanał złoże posze udoku wpływ figur wpisa wysta podzi załat dziej pomoż trzeb samej takim mówi").split(" "));

function contentWords(input: string) {
  // A signature after a question is not a condition of the benefit.
  return input.replace(/\S+@\S+|https?:\/\/\S+/giu, "")
    .replace(/\?\s+(?:\p{Lu}\p{Ll}+\s+){1,2}\p{Lu}\p{Ll}+[.,\d -]*$/u, "?")
    .toLocaleLowerCase("pl").match(/[a-ząćęłńóśźż]{4,}/gu) ?? [];
}

function hasUnknownProgrammeCondition(input: string, topic: PublicQuestion) {
  if (input === topic.question) return false;
  const named = offerDocuments.find(([pattern]) => pattern.test(input));
  if (!named) return false;
  const words = contentWords(input.replace(named[0], ""));
  return words.some(word => !programmeWords.has(word.slice(0, 5)));
}

// Public vocabulary is generated from the packaged statute. Only its fixed spellings leave the browser.
const legalWords: Record<string, string> = vocabulary.terms;
const statuteStems = new Set(vocabulary.statuteStems.split(" "));
const allowedLegalWords = new Set(Object.values(legalWords));
const commonLegalWords = new Set(vocabulary.common);
const detailPrefixes = ["Zasiłek chorobowy. ", "Ustawa zasiłkowa. "];
const articles = vocabulary.articles.map(terms => new Set(terms.split(" ")));
const legalFacets = {
  rate: "Jaki procent", proof: "Kto potwierdza", duration: "Jak długo", deadline: "Jaki termin",
  documents: "Jakie dokumenty", entitlement: "Czy przysługuje", info: "Co przewidują przepisy",
} as const;

export function publicLegalFacet(text: string): keyof typeof legalFacets | undefined {
  const detailPrefix = detailPrefixes.find(prefix => text.startsWith(prefix));
  if (!detailPrefix || !text.endsWith("?")) return;
  const [facet, terms, extra] = text.slice(detailPrefix.length, -1).split(" — ");
  const words = terms?.split(", ") ?? [];
  if (extra !== undefined || words.length < 2 || words.length > 8 || !words.every(w => allowedLegalWords.has(w))) return;
  // Disjoint conditions cannot become one public search by concatenating two valid sets of words.
  const subjects = words.filter(word => word !== "można" && !facet.toLocaleLowerCase("pl").split(" ").includes(word));
  let compatible = articles;
  for (let i = 0; i < subjects.length; i++) {
    const references = articles.filter(article => article.has(subjects[i]));
    const pair = i ? references.filter(article => article.has(subjects[i - 1])) : [];
    const constraint = pair.length ? pair : references.length === 1 ? references : [];
    if (constraint.length) compatible = compatible.filter(article => constraint.includes(article));
    if (!compatible.length) return;
  }
  return (Object.keys(legalFacets) as (keyof typeof legalFacets)[]).find(key => legalFacets[key] === facet);
}

export const isPublicLegalDetail = (text: string) => publicLegalFacet(text) !== undefined;

function generalWorkException(input: string): string | null {
  if (!sickLeave.test(input) || !/odpłatn|zarobkow/iu.test(input) ||
      !/czynnoś|prac[ęayą]/iu.test(input) || !/wyjąt|poleceni/iu.test(input)) return null;
  // Only general questions about a paid activity and the statutory exception fit this projection.
  const question = input.toLowerCase().replace(/\bl[- ]?4\b/gu, "zwolnienie");
  const words = question.match(/[\p{L}\p{N}]+/gu) ?? [];
  if (!words.every(w => /^(?:czy|i|na|w|po|o|z|ze|za|a|jest|są|jako|kiedy|jakie|jak|co|do|od|tylko|to|się|taka|taki|tę|ten|aby|żeby|podczas|przy|można)$/u.test(w) ||
      /^(?:czynnoś|pracodawc|pracowni|prac[ęayą]|odpłatn|zarobkow|jedn[ąaey]|jednorazow|pojedyncz|incydentaln|wyjąt|zwolnieni|lekarsk|chorobow|przełożon|szef|nalega|polec|stanowi|wystarcz|uzasadni|wykona|żąda|istotn|okolicznoś|znaczeni)/u.test(w))) return null;
  const order = /polec|nalega|żąda/iu.test(input) && /pracodawc|szef|przełożon/iu.test(input);
  const terms = "czynności, zarobkową, incydentalnych" + (order ? ", polecenie, pracodawcy" : "");
  return detailPrefixes[0] + legalFacets.info + " — " + terms + "?";
}

function legalDetail(input: string, broad: boolean): PublicQuestion | null {
  const implicitSickness = broad && !sickLeave.test(input);
  if (implicitSickness && (!/niezdolnoś/iu.test(input) || /niezdolnoś\p{L}* do /iu.test(input))) return null;
  input = input.replace(/\bl[- ]?4\b/giu, "");
  if (!broad && !/zasił|świadczeni|ubezpiecz|roszczeni/iu.test(input)) return null;
  if (asksAboutOwnEligibility(input) || scopeGate(input) || /(?:^|\s)(?:nie|bez|ani|brak\p{L}*|żad\p{L}*|nieodpłat\p{L}*|albo|lub|zamiast|oprócz)(?!\p{L})|\d/iu.test(input)) return null;
  const content = contentWords(input);
  if (content.some(word => !statuteStems.has(word.slice(0, 5)) && !programmeWords.has(word.slice(0, 5)) &&
      !/^(?:procent|stawk|poświadcz|udowod|dowieś|zwolnien|wypłat|chorobow)/u.test(word))) return null;
  const words = [...new Set(content.flatMap(word => {
    for (let length = 5; length <= 8; length++) {
      const key = word.slice(0, length);
      if (Object.hasOwn(legalWords, key)) return [legalWords[key]];
    }
    return [];
  }))].filter(w => !/^(?:imię|imion|nazwisk|adres|numer|jest|przy$|inne|jakie|który|które|chorobow|zasił|ubezpieczo|przysług|przypad|wpływ|stosuje|określ|obowiązuj)/u.test(w));
  const sameArticle = (left: string, right: string) => articles.some(article => article.has(left) && article.has(right));
  // In a long yes/no question the bare grammatical subject adds no condition.
  // Only omit it when the very next pair is corroborated by one article.
  if (words.length > 8 && /^czy osoba\s/iu.test(input) && words[0] === legalWords.osoba && sameArticle(words[1], words[2]))
    words.shift();
  if (implicitSickness && !words.some((word, i) => i > 0 && sameArticle(words[i - 1], word))) return null;
  const distinctive = words.filter(w => !commonLegalWords.has(w));
  if (words.length < 2 || words.length > 8 || !distinctive.length) return null;
  if (!broad && (distinctive.length < 2 || articles.filter(article => distinctive.every(w => article.has(w))).length !== 1)) return null;
  const detailPrefix = detailPrefixes[broad ? 0 : 1];
  const facet = /procent|stawk/iu.test(input) ? "rate" : /poświadcz|potwierdz|udowod|jak dowieść/iu.test(input) ? "proof" :
    /jak długo|ile dni|przez jaki okres/iu.test(input) ? "duration" : /do kiedy|termin/iu.test(input) ? "deadline" :
    /jakie dokumenty|jaki dokument/iu.test(input) ? "documents" : /przysługuje|ma prawo/iu.test(input) ? "entitlement" : "info";
  const question = detailPrefix + legalFacets[facet] + " — " + words.join(", ") + "?";
  return isPublicLegalDetail(question) ? {corpus: "publiczne", question} :
    {corpus: "publiczne", question: "", clarify: "O który warunek zasiłku chcesz zapytać?"};
}

function projectedQuestion(input: string, includeDetails: boolean): PublicQuestion | null {
  const topic = routeTopic(input);
  const limited = (clarify: string): PublicQuestion => ({ corpus: topic?.corpus ?? "publiczne", question: "", clarify });
  if (/(?:\d{1,2}[./-]){2}\d{2,4}|20\d{2}-\d{2}-\d{2}|\b(?:19|20)\d{2}\b|(?:w|od|do|za)\s+(?:stycz|lut|marc|kwiet|maj|czerwc|lipc|sierp|wrześ|paździer|listop|grud)/iu.test(input)) {
    return limited("Czy chodzi Ci o ocenę konkretnego okresu? Podaj rodzaj świadczenia i okres, który chcesz sprawdzić.");
  }
  if (/(?:moje dziecko|mój syn|moja córka|dziecko ma).{0,32}\d+\s*(?:miesię|lat|rok)/iu.test(input) && topic) {
    return limited("Czy chcesz sprawdzić wiek dziecka dla konkretnego okresu? Podaj datę urodzenia oraz okres, którego dotyczy pytanie.");
  }
  if (asksAboutOwnEligibility(input) &&
      !/800|300|aktywny rodzic/u.test(input) && topic?.corpus === "publiczne") {
    return limited("Chcesz sprawdzić własne uprawnienie? Wskaż rodzaj świadczenia i tytuł ubezpieczenia w swojej sprawie.");
  }
  if (topic?.corpus === "oferta" && (asksAboutOwnEligibility(input) ||
      /ile.{0,22}(?:dostanę|dostaniemy|otrzymam)|(?:moj[eaą]|nasz[ąae]).{0,16}(?:kwot|wypłat)/iu.test(input)))
    return limited("Chcesz sprawdzić własne uprawnienie? Doprecyzuj warunek programu dotyczący Twojej sprawy.");
  if (topic?.question === programmePeriodQuestion || topic?.question === programmeOpeningQuestion || topic?.requiredFragmentIds?.length) return topic;
  if (topic?.corpus === "oferta" && hasUnknownProgrammeCondition(input, topic)) {
    const clarify = "Który warunek programu chcesz sprawdzić? Nie udało mi się powiązać szczegółów pytania z publikacją.";
    return includeDetails ? limited(clarify) : { ...topic, clarify };
  }
  if (topic?.corpus === "oferta") return includeDetails ? offerDetail(input, topic) : topic;
  if (topic?.clarify || /^(?:Co stanowi art\.|Jakie zasady określa wskazany przepis)/u.test(topic?.question ?? "")) return topic;
  if (includeDetails && (!topic || topic.broad)) {
    const gate = scopeGate(input);
    if (gate && topic?.broad) return limited(gate.message);
    if (topic?.broad && (topic.question === input || (
      /samo|wystarcz|kiedy musi powstać/iu.test(input) &&
      contentWords(input).every(word => /^(?:samo|zwolnien|lekarsk|wystarcz|zasił|chorobow|prawo|przysług|niezdoln|powsta|pracy|kiedy|musi|otrzyma|dosta)/u.test(word))
    ))) return topic;
    const work = topic?.broad && generalWorkException(input);
    if (work) return {corpus: "publiczne", question: work};
    const detail = legalDetail(input, Boolean(topic));
    if (detail) return detail;
    if (topic?.broad && /czynnoś|zarobkow|pracodawc/iu.test(input) && sickLeave.test(input))
      return limited("Jaki charakter miała czynność podczas zwolnienia i z jakiego powodu trzeba było ją wykonać?");
    if (topic?.broad)
      return limited("Którą okoliczność dotyczącą chorobowego chcesz sprawdzić?");
  }
  const terms = OTHER_TOPICS.filter(([pattern]) => pattern.test(input)).map(([, label]) => label);
  if (terms.length && !(terms.length === 1 && topic?.question.includes("pół etatu"))
    && !(terms.length === 1 && (topic?.locators?.includes("uz:11:2") || topic?.locators?.includes("uz:19")))) {
    const context = /rodzicielsk/iu.test(input) ? "urlop rodzicielski" : /ojcowsk/iu.test(input) ? "urlop ojcowski" :
      /macierzyń/iu.test(input) ? "zasiłek macierzyński" : /chorobow|niezdoln/iu.test(input) ? "zasiłek chorobowy" : "";
    const intent = /termin|kiedy|do kiedy/iu.test(input) ? "termin" : /dokument|dołącz|wniosek/iu.test(input) ? "potrzebne dokumenty" : "warunki i zasady";
    return { corpus: "publiczne", question: `Co przewidują źródła w tej sytuacji: ${[context, ...terms, intent].filter(Boolean).join(", ")}?` };
  }
  return topic;
}


// Check the completed browser projection, including later qualifier-based rewrites.
export function publicQuestion(input: string, includeDetails = false): PublicQuestion | null {
  if (detailPrefixes.some(prefix => input.startsWith(prefix)) && input.includes(" — "))
    return isPublicLegalDetail(input) ? {corpus: "publiczne", question: input} :
      {corpus: "publiczne", question: "", clarify: "O który warunek zasiłku chcesz zapytać?"};
  if (input.startsWith(pairPrefix)) return projectPublicPair(input);
  const plan = includeDetails ? projectPublicPair(input) ?? projectedQuestion(input, true) : projectedQuestion(input, false);
  if (!includeDetails || !plan?.question || plan.clarify) return plan;
  const asked = publicBenefitTopics(input);
  const selected = publicBenefitTopics(plan.question);
  const correction = /(?:nie (?:chodzi|pytam)|zamiast|a nie|lecz|tylko o)/iu.test(input);
  // The reviewed transition after sickness exhaustion explicitly asks what comes next.
  const nextBenefit = plan.locators?.includes("uz:18") && /co dalej|dalsz|kolejn/iu.test(input);
  if ((asked.length > 1 && correction) ||
      (asked.length && selected.length && !selected.some(subject => asked.includes(subject)) && !nextBenefit)) {
    return { corpus: plan.corpus, question: "", clarify: "O które świadczenie chcesz zapytać?" };
  }
  return plan;
}

const pairPrefix = "Pytania publiczne: ";
const pairClarification = "O który warunek jednego programu chcesz zapytać?";

export function projectPublicPair(input: string): PublicQuestion | null {
  const transported = input.startsWith(pairPrefix);
  const body = transported ? input.slice(pairPrefix.length) : input;
  const separator = transported ? /(?<=\?) oraz /u :
    /\s+(?:oraz|i|a)\s+(?=(?:czy|jak\p{L}*|któr\p{L}*|kiedy|gdzie|kto|komu|ile|od kiedy|do kiedy)\b)/iu;
  const clauses = body.split(separator);
  if (clauses.length === 1) return null;
  const matches = offerDocuments.filter(([pattern]) => pattern.test(body));
  if (!matches.length) return null;
  const unclear: PublicQuestion = {corpus: "oferta", question: "", clarify: pairClarification};
  if (matches.length !== 1 || clauses.length !== 2) return unclear;
  const [pattern, , name] = matches[0];
  const programme = publicBenefitTopics(name);
  if (publicBenefitTopics(body).some(topic => !programme.includes(topic))) return unclear;
  // Canonical single-topic questions may already mention a second aspect in their vetted wording.
  if (!transported && routeTopic(body)?.question === body) return null;
  const questions = clauses.map((part, index) => {
    if (!transported && index === 1 && programme800.test(name) && /(?:nowy|kolejny) okres|okres świadczeniowy/iu.test(clauses[0]))
      part = part.replace(/(?:ten|taki) okres(?! świadczeniowy)/iu, "okres świadczeniowy");
    const standalone = pattern.test(part) ? part : name + ". " + part;
    const plan = projectedQuestion(standalone, true);
    if (!plan || plan.clarify || plan.corpus !== "oferta" || !pattern.test(plan.question)) return null;
    return plan.question;
  });
  const [first, second] = questions;
  if (!first || !second || first === second) return unclear;
  const question = pairPrefix + first + " oraz " + second;
  if (question.length > MAX_QUESTION_LENGTH || (transported && question !== input)) return unclear;
  return {corpus: "oferta", question};
}
