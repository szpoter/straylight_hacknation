import { OLA } from "../family/ola";
import { formatLong } from "../demo/dates";
import type { Plan, Stop } from "../demo/types";
import type { MartaView } from "../marta/types";
import { docStatus, pathStatus } from "../plan/status";

export type LocalPlan = { plan: Plan; isPatched: (stopId: string) => boolean; selectedStopId?: string };
export type PlanAnswer = { lines: string[]; source: string; readLeave?: boolean; caseIds?: string[] };

const normalize = (text: string) => text.toLowerCase().replaceAll("ł", "l").normalize("NFD").replace(/\p{M}/gu, "");
const subjects: [RegExp, string[]][] = [
  [/800\s*(?:\+|plus)?|wychowawcz/, ["800plus"]],
  [/macierzynsk/, ["zasilek-macierzynski", "urlop-macierzynski"]],
  [/rodzicielsk/, ["rodzicielski"]], [/ojcowsk/, ["urlop-ojcowski"]],
  [/becikow/, ["becikowe"]], [/odpis/, ["odpis"]],
  [/zglosz.{0,15}urodzeni|rejestracj.{0,12}urodzeni/, ["zglos-urodzenie"]],
  [/ubezpieczen.{0,15}(?:dzieck|zdrowotn)/, ["ubezpieczenie-dziecka"]],
];

function mentionedCases(text: string) {
  const ids = subjects.flatMap(([pattern, values]) => pattern.test(text) ? values : []);
  if (/urlop/.test(text) && !/zasil/.test(text)) return ids.filter(id => id !== "zasilek-macierzynski");
  if (/zasil/.test(text) && !/urlop/.test(text)) return ids.filter(id => id !== "urlop-macierzynski");
  return ids;
}

function profileQuestion(text: string) {
  const personal = /\b(?:ola|oli|ole|marta|marty|pawel|pawla|moj\w*|nasz\w*)\b/.test(text);
  return personal && /(?:kto|kim|jak (?:sie )?nazywa|jak ma na imie|jakie (?:sa |ma )?(?:dane|imiona|nazwisko)|kiedy (?:sie )?urodzi|data urodzenia|gdzie pracuj|(?:pokaz|podaj) (?:mi )?dane|kto jest|co wiesz|opowiedz|kiedy ma urodziny)/.test(text)
    && /dzieck|cork|syn|rodzin|rodzic|urodz|pracodawc|pracuj|\b(?:ola|oli|ole|marta|marty|pawel|pawla|mama|mamy|tata|taty|ojcem|matka)\b/.test(text)
    && !/zasi[lł]|swiadcze|przyslug|powin|uprawni|wnios|urlop|placi|wyplac/.test(text);
}

function profile(plan: Plan, question: string): PlanAnswer {
  const demo = plan.id === "ola";
  const child = demo && plan.name === OLA.child.split(" ")[0] ? OLA.child : plan.name;
  const birthDate = plan.keyDate || (demo ? OLA.birthDate : undefined);
  const dateLabel = plan.situation === "ciaza" || plan.kind === "planowane" ? "Planowany termin porodu"
    : plan.situation === "adopcja" || plan.situation === "piecza" ? "Pod opieką od" : "Data urodzenia";
  const when = /urodz|urodzin/.test(question);
  const employer = /pracodawc|pracuj/.test(question);
  const parents = /rodzic/.test(question);
  const mother = parents || /matk|mam[ay]|mama/.test(question);
  const father = parents || /ojc|tat[ay]/.test(question);
  const summary = !when && !employer && !mother && !father;
  const lines: string[] = [];
  if (summary || when) lines.push(child + (birthDate ? " · " + dateLabel.toLowerCase() + " " + formatLong(birthDate) : "") + ".");
  if (demo) {
    if (summary || mother) lines.push("Matka — " + OLA.mother + ".");
    if (summary || father) lines.push("Ojciec — " + OLA.father + ".");
    if (summary || employer) lines.push("Pracodawca matki — " + OLA.employer + ".");
  } else if (employer || mother || father) {
    lines.push("W tym planie nie mam potwierdzonych danych rodziców ani pracodawcy.");
  }
  return { lines, source: demo ? "Profil rodziny i wybrany plan w tej przeglądarce." : "Wybrany plan w tej przeglądarce." };
}

function statusLine(stop: Stop, isPatched: LocalPlan["isPatched"]) {
  const label = stop.doc && stop.state ? docStatus(stop.state).label : pathStatus(stop);
  return stop.title + " — " + label + (isPatched(stop.id) ? " (zmiana zapisana przez Ciebie)." : " (z planu).");
}

export function planAnswer(raw: string, local: LocalPlan, previous?: PlanAnswer): PlanAnswer | null {
  const text = normalize(raw.trim());
  if (previous && /^(?:a )?(?:skad (?:to |o tym )?wiesz|skad (?:te |masz )?(?:dane|informacje)|(?:podaj |pokaz )?(?:zrodlo|podstawe)|czy to (?:dane |status )?z zus)[?!. ]*$/u.test(text)) {
    return { ...previous, lines: [], readLeave: false };
  }
  if (profileQuestion(text)) return profile(local.plan, text);
  if (/jak (?:moge |mozna )?(?:sprawdzic|sledzic|zlozyc)|gdzie (?:moge |mozna )?(?:sprawdzic|zlozyc)|co oznacza|co to (?:znaczy|jest)|jaki (?:jest )?termin|do kiedy|przyslug|jakie dokumenty|zasad/.test(text)) return null;
  if (/status (?:ubezpieczen|platnika|ubezpieczonego)/.test(text)) return null;
  const mentioned = mentionedCases(text);
  const follow = Boolean(previous?.caseIds && /^(?:a |i |co z )/u.test(text) && mentioned.length && text.split(/\s+/).length < 7);
  const status = /\bstatus\w*|\bstan (?:moj|moi|nasz|tej|tego|spraw|wniosk)|na (?:jakim|ktorym) etapie|co (?:sie dzieje |dalej )?z (?:moj|moi|nasz|wniosk|tym wniosk)|(?:czy |co |ktore ).*(?:wyslan|wyslal|wyslalam|zlozon|zlozyl|zlozylam|zatwierdz|rozpatrzon|wplynal|dotarl|dostal moj wniosek|zostalo do zrobienia)|(?:jakie|pokaz|wymien|podsumuj|ktore).*(?:moje|nasze|mam|mamy|oli).*(?:wniosk|spraw)|jakie (?:wnioski|sprawy) (?:mam|mamy)/u.test(text);
  if (!status && !follow) return null;
  const { plan, selectedStopId, isPatched } = local;
  const ids = mentioned.length ? mentioned : (selectedStopId ? [selectedStopId.replace(/^e-/, "")] : []);
  const unknownNamedCase = !mentioned.length && /wnios\w* (?:o|na) |(?:stan|status) (?:mojego |mojej )?(?:zasilku|swiadczenia|urlopu) /.test(text);
  const sentOnly = !ids.length && /(?:ktore|jakie|co).*(?:wysla|zlozyl|zlozon)/.test(text);
  const cases = unknownNamedCase ? [] : plan.stops.filter(s => ids.length ? ids.includes(s.id.replace(/^e-/, "")) : Boolean(s.doc && s.state && (!sentOnly || s.state === "wyslano")));
  const lines = cases.map(s => statusLine(s, isPatched));
  if (!lines.length) lines.push("W wybranym planie nie ma zapisanego statusu tej sprawy.");
  return { lines, source: "Plan „" + plan.name + "” w tej przeglądarce. ZUS nie potwierdza tu rzeczywistego wpływu ani decyzji.",
    caseIds: cases.map(s => s.id), readLeave: plan.id === "ola" && cases.some(s => s.id === "rodzicielski") };
}

export function sessionLeaveStatus(view: MartaView | null): string | null {
  if (!view || view.childName !== OLA.child || view.firstName !== OLA.mother) return null;
  const state = view.submitted ? "rodzic oznaczył samodzielne przekazanie pracodawcy" : view.confirmed ? "zatwierdzony" : view.selected ? "szkic z wybranym wariantem" : "porównanie wariantów";
  return "Osobny wniosek o urlop rodzicielski w tej sesji — " + state + ".";
}
