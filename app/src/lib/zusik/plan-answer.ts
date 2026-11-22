import { OLA } from "../family/ola";
import { importFamilyProfile, type FamilyProfile } from "../family/import-profile";
import { formatLong } from "../demo/dates";
import type { Plan, Stop } from "../demo/types";
import type { MartaView } from "../marta/types";
import { HANDOFF_RECORDED, docStatus, pathStatus } from "../plan/status";

type FamilySnapshot = Record<keyof FamilyProfile, string>;
export type LocalPlan = { plan: Plan; family?: FamilySnapshot; isPatched: (stopId: string) => boolean; selectedStopId?: string };
export type PlanAnswer = { lines: string[]; sourceExplanation: string; readLeave?: boolean; caseIds?: string[] };

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
  const personal = /\b(?:ola|oli|ole|marta|marty|pawel|pawla|tata|ojciec|matka|maz|moj\w*|nasz\w*)\b/.test(text);
  return personal && /(?:kto|kim|jak (?:sie )?nazywa|jak ma na imie|jakie (?:sa |ma )?(?:dane|imiona|nazwisko)|kiedy (?:sie )?urodzi|data urodzenia|gdzie pracuj|(?:pokaz|podaj) (?:mi )?dane|kto jest|co wiesz|opowiedz|kiedy ma urodziny)/.test(text)
    && /dzieck|cork|syn|rodzin|rodzic|urodz|pracodawc|pracuj|\b(?:ola|oli|ole|marta|marty|pawel|pawla|mama|mamy|tata|taty|ojcem|matka)\b/.test(text)
    && !/zasi[lł]|swiadcze|przyslug|powin|uprawni|wnios|urlop|placi|wyplac/.test(text);
}

function explainProfile(plan: Plan, family?: FamilySnapshot) {
  const names = family && (family.mother !== OLA.mother || family.father !== OLA.father) ? "rodziny" : "Marty i Pawła Lisów";
  return plan.id === "ola" ? `W tej demonstracji symulujemy import danych ${names} z aplikacji mObywatel i mZUS. Plan uwzględnia również późniejsze zmiany rodziny.`
    : "Te dane zapisano w wybranym planie rodziny.";
}

function profile({ plan, family = importFamilyProfile() }: LocalPlan, question: string): PlanAnswer {
  const demo = plan.id === "ola";
  const child = demo && plan.name === OLA.child.split(" ")[0] ? family.child : plan.name;
  const birthDate = demo && (!plan.keyDate || plan.keyDate === OLA.birthDate) ? family.birthDate : plan.keyDate;
  const dateLabel = plan.situation === "ciaza" || plan.kind === "planowane" ? "Planowany termin porodu"
    : plan.situation === "adopcja" || plan.situation === "piecza" ? "Pod opieką od" : "Data urodzenia";
  const when = /urodz/.test(question);
  const insurance = /ubezpieczen|ubezpieczon/.test(question);
  const employer = /pracodawc|pracuj/.test(question);
  const parents = /rodzic/.test(question);
  const mother = parents || /matk|mam[ay]|mart[ay]/.test(question);
  const father = parents || /ojc|tat[ay]|pawel|pawla|\bmaz\b/.test(question);
  const summary = !when && !employer && !insurance && !mother && !father;
  const lines: string[] = [];
  if (when && (mother || father)) lines.push("Brakuje daty urodzenia tego rodzica.");
  else if (summary || when) lines.push(child + (birthDate ? " · " + dateLabel.toLowerCase() + " " + formatLong(birthDate) : "") + ".");
  if (demo) {
    if (summary || mother && !employer && !insurance) lines.push("Matka — " + family.mother + ".");
    if (summary || father && !employer && !insurance) lines.push("Ojciec — " + family.father + ".");
    if (summary || employer && !father) lines.push("Pracodawca matki — " + family.employer + ".");
    if (employer && father) lines.push("Brakuje danych o pracodawcy ojca.");
    if (insurance) {
      if (father) lines.push("Brakuje danych o ubezpieczeniu ojca.");
      else if (/dzieck|cork|\boli\b/.test(question) && !mother) lines.push("Brakuje potwierdzenia aktualnego ubezpieczenia dziecka.");
      else {
        lines.push("Tytuł ubezpieczenia matki — " + family.insuranceTitle + ".");
        if (/status|aktualn|ubezpieczon/.test(question)) lines.push("Potwierdzenie aktywnego ubezpieczenia wymaga sprawdzenia okresu w eZUS.");
      }
    }
  } else if (employer || mother || father || insurance) {
    lines.push("W tym planie nie mam potwierdzonych danych rodziców ani pracodawcy.");
  }
  return { lines, sourceExplanation: explainProfile(plan, family) };
}

function statusLine(stop: Stop) {
  if (stop.state === "wyslano" && stop.doc?.events?.some(e => e.title === HANDOFF_RECORDED && e.author === "Ty")) {
    return stop.title + " — " + HANDOFF_RECORDED + ".";
  }
  const label = stop.doc && stop.state ? docStatus(stop.state).label : pathStatus(stop);
  return stop.title + " — " + label + ".";
}

export function planAnswer(raw: string, local: LocalPlan, previous?: PlanAnswer): PlanAnswer | null {
  const text = normalize(raw.trim());
  const sourceFollowUp = /^(?:a )?(?:skad (?:to |o tym )?wiesz|skad (?:pochodza |masz |macie |sa )?(?:te )?(?:dane|informacje)|(?:podaj |pokaz )?(?:zrodlo|podstawe)|czy to (?:dane |status )?z (?:zus|mzus|mobywatela))[?!. ]*$/u.test(text);
  if (previous && sourceFollowUp) {
    return { ...previous, lines: [previous.sourceExplanation], readLeave: false };
  }
  const asksFamilySource = /^(?:a )?(?:skad|z jak(?:iego|ich) zrodl)/.test(text)
    && /(?:moje|nasze) dane|(?:dane|informacje) (?:o |moj|nasz|osobow|rodzin|marty|pawla|oli)|dat[eay] urodzenia (?:oli|mojego dziecka)/.test(text);
  if (asksFamilySource) {
    const sourceExplanation = explainProfile(local.plan, local.family);
    return { lines: [sourceExplanation], sourceExplanation };
  }
  if (profileQuestion(text)) return profile(local, text);
  if (/jak (?:moge |mozna )?(?:sprawdzic|sledzic|zlozyc)|gdzie (?:moge |mozna )?(?:sprawdzic|zlozyc)|co oznacza|co to (?:znaczy|jest)|jaki (?:jest )?termin|do kiedy|przyslug|jakie dokumenty|zasad/.test(text)) return null;
  if (/ubezpieczen|ubezpieczon/.test(text) && !/wnios|zglosz/.test(text)) {
    return /(?:tytul|status|ubezpieczon)/.test(text) && /moj|moi|nasz|jestem|\b(?:ola|oli|marta|marty|pawel|pawla|tata|taty|ojca|mamy|matki)\b/.test(text)
      ? profile(local, text) : null;
  }
  if (/status (?:platnika|ubezpieczonego)/.test(text)) return null;
  const mentioned = mentionedCases(text);
  const follow = Boolean(previous?.caseIds && /^(?:a |i |co z )/u.test(text) && mentioned.length && text.split(/\s+/).length < 7);
  const status = /\bstatus\w*|\bstan (?:moj|moi|nasz|tej|tego|spraw|wniosk)|na (?:jakim|ktorym) etapie|co (?:sie dzieje |dalej )?z (?:moj|moi|nasz|wniosk|tym wniosk)|(?:czy |co |ktore ).*(?:wyslan|wyslal|wyslalam|zlozon|zlozyl|zlozylam|zatwierdz|rozpatrzon|wplynal|dotarl|dostal moj wniosek|zostalo do zrobienia)|(?:jakie|pokaz|wymien|podsumuj|ktore).*(?:moje|nasze|mam|mamy|oli).*(?:wniosk|spraw)|jakie (?:wnioski|sprawy) (?:mam|mamy)/u.test(text);
  if (!status && !follow) return null;
  const { plan, selectedStopId, isPatched } = local;
  const ids = mentioned.length ? mentioned : (selectedStopId ? [selectedStopId.replace(/^e-/, "")] : []);
  const unknownNamedCase = !mentioned.length && /wnios\w* (?:o|na) |(?:stan|status) (?:mojego |mojej )?(?:zasilku|swiadczenia|urlopu) /.test(text);
  const sentOnly = !ids.length && /(?:ktore|jakie|co).*(?:wysla|zlozyl|zlozon)/.test(text);
  const cases = unknownNamedCase ? [] : plan.stops.filter(s => ids.length ? ids.includes(s.id.replace(/^e-/, "")) : Boolean(s.doc && s.state && (!sentOnly || s.state === "wyslano")));
  const lines = cases.map(statusLine);
  if (!lines.length) lines.push("W wybranym planie nie ma zapisanego statusu tej sprawy.");
  const edited = cases.filter(s => isPatched(s.id)).map(s => s.title);
  const sourceExplanation = explainProfile(plan, local.family) + (edited.length ? " Rodzic zmienił status w planie dla spraw: " + edited.join(", ") + "." : "");
  return { lines, sourceExplanation,
    caseIds: cases.map(s => s.id), readLeave: plan.id === "ola" && cases.some(s => s.id === "rodzicielski") };
}

export function sessionLeaveStatus(view: MartaView | null, family: Pick<FamilySnapshot, "child" | "mother"> = OLA): string | null {
  if (!view || view.childName !== family.child || view.firstName !== family.mother) return null;
  const state = view.handoffRecordedByParent ? "rodzic oznaczył samodzielne przekazanie pracodawcy" : view.submitted ? "wcześniejszy wpis o przekazaniu" : view.confirmed ? "zatwierdzony" : view.selected ? "szkic z wybranym wariantem" : "porównanie wariantów";
  return "Osobny wniosek o urlop rodzicielski — " + state + ".";
}
