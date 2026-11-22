import { explicitLocatorKeys } from "./query";
import type { CorpusCandidate } from "./retrieve";

// Only these prewritten public questions can reach hosted inference. Uploaded
// documents, identities and free-form explanations stay outside the search prompt.
export interface PublicQuestion {
  corpus: "marta" | "publiczne" | "oferta";
  question: string;
  locators?: string[];
  fragmentId?: string;
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

function routeTopic(input: string): PublicQuestion | null {
  const q = input.toLocaleLowerCase("pl").normalize("NFC");
  const generic = (question: string, locators?: string[]): PublicQuestion => ({ corpus: "publiczne", question, locators });
  const marta = (question: string): PublicQuestion => ({ corpus: "marta", question });
  if (/ulg[aięą]\s+rehabilitacyjn/u.test(q)) return null;

  const offer = (id: string, question: string): PublicQuestion => ({ corpus: "oferta", question, locators: ["program:" + id] });
  if (/800\s*(?:\+|plus)|świadczenie wychowawcze/u.test(q)) return offer("800-plus", "Jak ZUS opisuje program 800+ i kiedy można złożyć wniosek na nowy okres?");
  if (/dobry start|300\s*(?:\+|plus)|wyprawk/u.test(q)) {
    if (/do kiedy|od kiedy|termin|najpóźniej/u.test(q)) return offer("dobry-start:termin", "W jakim terminie można złożyć wniosek o świadczenie Dobry Start?");
    if (/sposób złożenia|którędy|gdzie|kanał|online|elektroniczn|bankowoś|mzus|przez co|jak.{0,15}(?:wysłać|złożyć)/u.test(q))
      return offer("dobry-start:kanaly", "Jakimi kanałami rodzic może złożyć elektroniczny wniosek o Dobry Start?");
    return offer("dobry-start", "Na czym polega świadczenie Dobry Start na wyprawkę szkolną?");
  }
  if (/aktywn[yaie]+ rodzic|aktywnie w|żłobk|babciow/u.test(q)) return offer("aktywny-rodzic", "Jakie świadczenia wymienia ZUS w programie Aktywny Rodzic?");
  const explicit = explicitLocatorKeys(q);
  if (explicit.length) return { ...marta(`Jakie zasady określa wskazany przepis: ${explicit.join(", ")}?`), locators: explicit };
  const statute = q.match(/art\.?\s*(\d{1,3}[a-z]?)(?:\s+ust\.?\s*(\d{1,2}))?/u);
  if (statute && /zasiłkow|chorobow|świadczeniach pieniężnych/u.test(q)) {
    const [, article, paragraph] = statute;
    return generic(`Co stanowi art. ${article}${paragraph ? " ust. " + paragraph : ""} ustawy zasiłkowej?`,
      paragraph ? [`uz:${article}:${paragraph}`, `uz:${article}`] : [`uz:${article}`]);
  }
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

  if (/zwolnien|e-zla|niezdolno|chorobow/iu.test(q)) {
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
  if (/wysłać.{0,20}elektr|elektronicz|mailem|przez internet|online/u.test(q)) return marta("Czy wniosek do pracodawcy o urlop rodzicielski można złożyć elektronicznie?");
  if (/odmówi|odmowa/u.test(q)) return marta("Czy pracodawca może odmówić udzielenia urlopu rodzicielskiego po złożeniu wniosku w terminie?");
  if (/podziel|kawał|częś|ile razy/u.test(q)) return marta("Na ile części można podzielić urlop rodzicielski?");
  if (/do kiedy|wiek dziecka|do jakiego wieku/u.test(q)) return marta("Do jakiego wieku dziecka można wykorzystać urlop rodzicielski?");
  if (period.test(q) && /wniosek|wnios|urlop|kadr|szef|przed startem|złożyć/u.test(q)) return marta("Ile wcześniej i do kogo trzeba złożyć wniosek o urlop rodzicielski?");
  if (/ile tygodni|wymiar/u.test(q)) return marta("Jak wymiar urlopu rodzicielskiego zależy od liczby dzieci urodzonych przy jednym porodzie?");
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
  [/podstaw[ayę] wymiaru/iu, "podstawa wymiaru zasiłku"], [/podwójn|drug(?:a|iej) prac|drug(?:i|iego) tytuł/iu, "kilka tytułów ubezpieczenia"],
  [/opiekuń|opieki nad/iu, "zasiłek opiekuńczy"], [/porzuce/iu, "porzucenie dziecka przez matkę"],
  [/hospitaliz|szpital/iu, "pobyt dziecka w szpitalu"], [/wcześniak|przedwcześnie urodz/iu, "urodzenie dziecka przed terminem"],
  [/pół etatu|część etatu|niepełn\p{L}*\s+(?:wymiar|etat)/iu, "wykonywanie pracy w niepełnym wymiarze"],
];
export function asksAboutOwnEligibility(input: string): boolean {
  return /czy (?:mi |nam )(?:przysługuje|należy się)|czy (?:przysługuje|należy się) (?:mi|nam)\b|czy dostanę|czy mam prawo/iu.test(input);
}
export function publicQuestion(input: string): PublicQuestion | null {
  const topic = routeTopic(input);
  const limited = (clarify: string): PublicQuestion => ({ corpus: topic?.corpus ?? "publiczne", question: "", clarify });
  if (/(?:\d{1,2}[./-]){2}\d{2,4}|20\d{2}-\d{2}-\d{2}|\b(?:19|20)\d{2}\b|(?:w|od|do|za)\s+(?:stycz|lut|marc|kwiet|maj|czerwc|lipc|sierp|wrześ|paździer|listop|grud)/iu.test(input)) {
    return limited("Czy chodzi Ci o ocenę konkretnego okresu? Wybierz sprawę w panelu, aby sprawdzić daty i dokumenty.");
  }
  if (/(?:moje dziecko|mój syn|moja córka|dziecko ma).{0,32}\d+\s*(?:miesię|lat|rok)/iu.test(input) && topic) {
    return limited("Czy chcesz sprawdzić wiek dziecka dla konkretnego okresu? Wybierz sprawę i potwierdź datę urodzenia.");
  }
  if (asksAboutOwnEligibility(input) &&
      !/800|300|aktywny rodzic/u.test(input) && topic?.corpus === "publiczne") {
    return limited("Chcesz sprawdzić własne uprawnienie? Wskaż rodzaj świadczenia i tytuł ubezpieczenia w swojej sprawie.");
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
