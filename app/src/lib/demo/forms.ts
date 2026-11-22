/**
 * Pola wniosków w „Dokumentach i wnioskach” (dane demo). Każda sprawa z dokumentem w planach demo
 * ma tu swój formularz: sekcje, pola, podpowiedzi i wartości podstawiane z planu i profilu.
 *
 * Układ pól wzorujemy na oficjalnych drukach, ale to uproszczenie — wierność drukowi (numery pól,
 * kolejność, nazwy) jest „do weryfikacji” przy każdym formularzu (`fidelity`). Druk ZAM z dokładną
 * mapą pól ma zespół Kamila w `lib/forms/zam-map.ts`; tu go nie powielamy.
 * TODO(backend): definicje formularzy i zapis wartości w sprawie.
 */
import type { Plan } from "./types";

export type FieldType = "text" | "date" | "select" | "radio" | "textarea" | "pesel" | "account";

export type FormField = {
  id: string;
  label: string;
  hint?: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
  /** Wartość podstawiona na start (z planu albo profilu). Rodzic może ją zmienić. */
  prefill?: (ctx: PrefillContext) => string | undefined;
  /** Pole widoczne tylko przy danej odpowiedzi innego pola. */
  showIf?: { field: string; equals: string };
};

export type FormSection = { id: string; title: string; fields: FormField[] };

export type FormDef = {
  /** Nazwa druku, np. „Wniosek o świadczenie wychowawcze (SW-1)”. */
  name: string;
  /** Uwaga o wierności drukowi; pokazywana małym tekstem pod nagłówkiem. */
  fidelity: string;
  /** Gdzie trafia wniosek — kanały do wyboru przy „Przekaż”. */
  channels: Channel[];
  sections: FormSection[];
};

export type Channel = "pue" | "pracodawca" | "email" | "urzad";

export const CHANNEL_LABEL: Record<Channel, { label: string; hint: string }> = {
  pue: { label: "Przez PUE/eZUS", hint: "Wniosek trafia do ZUS elektronicznie, potwierdzenie (UPP) przychodzi od razu." },
  pracodawca: { label: "Do pracodawcy", hint: "Pracodawca dostaje wniosek i przekazuje dane do ZUS." },
  email: { label: "E-mailem jako PDF", hint: "Wyślesz plik sam(a), np. do kadr. Potwierdzenie wpiszesz po odpowiedzi." },
  urzad: { label: "Do urzędu przez ePUAP", hint: "Pismo trafia do skrzynki urzędu, potwierdzenie (UPO) przychodzi automatycznie." },
};

export type PrefillContext = {
  parentName: string;
  employer: string;
  childName?: string;
  /** Data urodzenia (ISO), gdy dziecko jest na świecie. */
  birthDate?: string;
  /** Planowany termin porodu (ISO) dla planu oczekiwanego dziecka. */
  dueDate?: string;
};

/** Dane do podstawienia z planu i profilu demonstracyjnego (Profil → Moje dane). */
export function prefillContext(plan: Pick<Plan, "name" | "kind" | "keyDate">, profile: { parentName: string; employer: string }): PrefillContext {
  const born = plan.kind !== "planowane";
  const childName = born ? plan.name.replace(/^Sprawa testowa · /, "").replace(/^Przykład · .*/, "") || undefined : undefined;
  return { ...profile, childName, birthDate: born ? plan.keyDate : undefined, dueDate: born ? undefined : plan.keyDate };
}

const YES_NO = ["Tak", "Nie"];

// Pola powtarzane w wielu wnioskach.
const parent = (label = "Imię i nazwisko"): FormField => ({ id: "rodzic", label, type: "text", required: true, prefill: (c) => c.parentName });
const parentPesel: FormField = { id: "rodzic_pesel", label: "Twój numer PESEL", type: "pesel", required: true, hint: "11 cyfr" };
const child: FormField = { id: "dziecko", label: "Imię i nazwisko dziecka", type: "text", required: true, prefill: (c) => c.childName };
const childPesel: FormField = { id: "dziecko_pesel", label: "Numer PESEL dziecka", type: "pesel", required: true, hint: "Z odpisu aktu urodzenia albo z mObywatela" };
const birth: FormField = { id: "data_urodzenia", label: "Data urodzenia dziecka", type: "date", required: true, prefill: (c) => c.birthDate };
const employer: FormField = { id: "pracodawca", label: "Pracodawca", type: "text", required: true, prefill: (c) => c.employer };
const payout: FormField[] = [
  { id: "wyplata", label: "Sposób wypłaty", type: "radio", required: true, options: ["Na rachunek bankowy", "Przekazem pocztowym"], prefill: () => "Na rachunek bankowy" },
  { id: "rachunek", label: "Numer rachunku", type: "account", required: true, hint: "26 cyfr, np. 12 3456 7890 1234 5678 9012 3456", showIf: { field: "wyplata", equals: "Na rachunek bankowy" } },
];

export const FORMS: Record<string, FormDef> = {
  "zasilek-macierzynski": {
    name: "Wniosek o zasiłek macierzyński za okres urlopu",
    fidelity: "Uproszczony układ wniosku składanego przez pracodawcę — do weryfikacji z drukiem ZUS.",
    channels: ["pracodawca", "email"],
    sections: [
      { id: "ty", title: "Twoje dane", fields: [parent(), parentPesel, employer] },
      {
        id: "dziecko",
        title: "Dziecko",
        fields: [child, childPesel, birth, { id: "liczba_dzieci", label: "Liczba dzieci urodzonych przy jednym porodzie", type: "select", required: true, options: ["1", "2", "3", "4 lub więcej"], prefill: () => "1" }],
      },
      {
        id: "zakres",
        title: "Zakres wniosku",
        fields: [
          {
            id: "caly_okres",
            label: "Czy wnioskujesz o zasiłek za cały okres urlopu macierzyńskiego i rodzicielskiego?",
            hint: "„Tak” — 81,5% podstawy za cały czas. „Nie” — 100% za urlop macierzyński, potem 70% za rodzicielski.",
            type: "radio",
            required: true,
            options: YES_NO,
          },
        ],
      },
      { id: "wyplata", title: "Wypłata", fields: payout },
    ],
  },
  "urlop-macierzynski": {
    name: "Wniosek o urlop macierzyński",
    fidelity: "Pismo do pracodawcy w dowolnej formie — układ wzorcowy, do weryfikacji z kadrami.",
    channels: ["pracodawca", "email"],
    sections: [
      { id: "ty", title: "Twoje dane", fields: [parent(), employer] },
      {
        id: "urlop",
        title: "Urlop",
        fields: [
          birth,
          { id: "od", label: "Urlop od", type: "date", required: true, prefill: (c) => c.birthDate, hint: "Najpóźniej w dniu porodu; wcześniej — najwyżej 6 tygodni przed terminem" },
          { id: "tygodnie", label: "Wymiar urlopu", type: "select", required: true, options: ["20 tygodni (1 dziecko)", "31 tygodni (2 dzieci)", "33 tygodnie (3 dzieci)"], prefill: () => "20 tygodni (1 dziecko)" },
        ],
      },
    ],
  },
  "urlop-ojcowski": {
    name: "Wniosek o urlop ojcowski",
    fidelity: "Pismo do pracodawcy — składasz najpóźniej 7 dni przed urlopem. Układ wzorcowy, do weryfikacji.",
    channels: ["pracodawca", "email"],
    sections: [
      {
        id: "ty",
        title: "Drugi rodzic",
        // Urlop ojcowski bierze drugi rodzic — jego danych nie ma w profilu, więc bez podstawiania.
        fields: [
          { id: "rodzic", label: "Imię i nazwisko drugiego rodzica", type: "text", required: true },
          { id: "pracodawca", label: "Pracodawca drugiego rodzica", type: "text", required: true },
        ],
      },
      { id: "dziecko", title: "Dziecko", fields: [child, birth] },
      {
        id: "urlop",
        title: "Urlop",
        fields: [
          { id: "od", label: "Urlop od", type: "date", required: true, hint: "Do ukończenia przez dziecko 12 miesięcy; wniosek najpóźniej 7 dni wcześniej" },
          { id: "czesci", label: "Jak chcesz wykorzystać urlop?", type: "radio", required: true, options: ["2 tygodnie naraz", "2 razy po tygodniu"], prefill: () => "2 tygodnie naraz" },
        ],
      },
    ],
  },
  rodzicielski: {
    name: "Wniosek o urlop rodzicielski",
    fidelity: "Pismo do pracodawcy — składasz najpóźniej 21 dni przed urlopem. Układ wzorcowy, do weryfikacji.",
    channels: ["pracodawca", "email"],
    sections: [
      { id: "ty", title: "Twoje dane", fields: [parent(), employer] },
      { id: "dziecko", title: "Dziecko", fields: [child, birth] },
      {
        id: "urlop",
        title: "Urlop",
        fields: [
          { id: "od", label: "Urlop od", type: "date", required: true },
          { id: "tygodnie", label: "Liczba tygodni", type: "select", required: true, options: ["8", "16", "24", "32", "41"], hint: "Każdy rodzic ma 9 tygodni tylko dla siebie (nieprzenoszalne)" },
          { id: "praca", label: "Czy łączysz urlop z pracą na część etatu?", type: "radio", required: true, options: YES_NO, prefill: () => "Nie" },
          { id: "wymiar", label: "Wymiar pracy w czasie urlopu", type: "select", options: ["1/4 etatu", "1/3 etatu", "1/2 etatu"], showIf: { field: "praca", equals: "Tak" }, required: true },
        ],
      },
    ],
  },
  "800plus": {
    name: "Wniosek o świadczenie wychowawcze 800+ (SW-1)",
    fidelity: "Najważniejsze pola wniosku SW-1 składanego przez PUE/eZUS — do weryfikacji z drukiem.",
    channels: ["pue"],
    sections: [
      { id: "ty", title: "Wnioskodawca", fields: [parent(), parentPesel, { id: "adres", label: "Adres zamieszkania", type: "textarea", required: true }] },
      { id: "dziecko", title: "Dziecko", fields: [child, childPesel, birth, { id: "wspolne", label: "Czy dziecko mieszka z Tobą?", type: "radio", required: true, options: YES_NO, prefill: () => "Tak" }] },
      // 800+ wypłaca ZUS wyłącznie na rachunek bankowy.
      { id: "wyplata", title: "Wypłata", fields: [{ ...payout[1], showIf: undefined }] },
    ],
  },
  becikowe: {
    name: "Wniosek o jednorazową zapomogę z tytułu urodzenia dziecka (becikowe)",
    fidelity: "Wzór gminy może się różnić — do weryfikacji z drukiem urzędu gminy.",
    channels: ["urzad"],
    sections: [
      { id: "ty", title: "Wnioskodawca", fields: [parent(), parentPesel, { id: "adres", label: "Adres zamieszkania", type: "textarea", required: true }] },
      { id: "dziecko", title: "Dziecko", fields: [child, childPesel, birth] },
      {
        id: "warunki",
        title: "Warunki",
        fields: [
          { id: "opieka", label: "Czy masz zaświadczenie o opiece lekarskiej od 10. tygodnia ciąży?", type: "radio", required: true, options: YES_NO },
          { id: "dochod", label: "Dochód na osobę w rodzinie (miesięcznie, netto)", type: "text", required: true, hint: "Próg: 1922 zł na osobę — do weryfikacji w gminie" },
        ],
      },
      { id: "wyplata", title: "Wypłata", fields: payout },
    ],
  },
  "ubezpieczenie-dziecka": {
    name: "Zgłoszenie dziecka do ubezpieczenia zdrowotnego (ZUS ZCNA)",
    fidelity: "Dane do druku ZCNA, który składa pracodawca — do weryfikacji z drukiem ZUS.",
    channels: ["pracodawca", "email"],
    sections: [
      { id: "ty", title: "Ubezpieczony rodzic", fields: [parent(), employer] },
      {
        id: "dziecko",
        title: "Członek rodziny",
        fields: [
          child,
          childPesel,
          birth,
          { id: "pokrewienstwo", label: "Stopień pokrewieństwa", type: "select", required: true, options: ["Dziecko własne", "Dziecko przysposobione", "Dziecko w rodzinie zastępczej"], prefill: () => "Dziecko własne" },
          { id: "gospodarstwo", label: "Czy dziecko pozostaje z Tobą we wspólnym gospodarstwie domowym?", type: "radio", required: true, options: YES_NO, prefill: () => "Tak" },
        ],
      },
    ],
  },
  "zglos-urodzenie": {
    name: "Zgłoszenie urodzenia dziecka",
    fidelity: "Dane zgłoszenia w USC albo przez gov.pl — do weryfikacji z formularzem urzędu.",
    channels: ["urzad"],
    sections: [
      {
        id: "dziecko",
        title: "Dziecko",
        fields: [
          { id: "imiona", label: "Imię (imiona) dziecka", type: "text", required: true, hint: "Najwyżej dwa imiona", prefill: (c) => c.childName?.split(" ")[0] },
          { id: "nazwisko", label: "Nazwisko dziecka", type: "text", required: true },
          { id: "plec", label: "Płeć", type: "radio", required: true, options: ["Dziewczynka", "Chłopiec"] },
          birth,
          { id: "miejsce", label: "Miejsce urodzenia", type: "text", required: true, hint: "Miejscowość" },
        ],
      },
      { id: "ty", title: "Zgłaszający", fields: [parent(), parentPesel] },
    ],
  },
  odpis: {
    name: "Wniosek o wydanie odpisu aktu urodzenia",
    fidelity: "Wniosek przez gov.pl albo w USC — do weryfikacji z formularzem urzędu.",
    channels: ["urzad"],
    sections: [
      { id: "ty", title: "Wnioskodawca", fields: [parent(), parentPesel] },
      {
        id: "odpis",
        title: "Odpis",
        fields: [
          child,
          birth,
          { id: "rodzaj", label: "Rodzaj odpisu", type: "radio", required: true, options: ["Skrócony", "Zupełny", "Wielojęzyczny"], prefill: () => "Skrócony" },
          { id: "liczba", label: "Liczba egzemplarzy", type: "select", required: true, options: ["1", "2", "3"], prefill: () => "1" },
          { id: "odbior", label: "Sposób odbioru", type: "radio", required: true, options: ["Osobiście w urzędzie", "Pocztą na adres zamieszkania"] },
        ],
      },
    ],
  },
  poz: {
    name: "Deklaracja wyboru lekarza i przychodni POZ",
    fidelity: "Najważniejsze pola deklaracji POZ — do weryfikacji z drukiem przychodni.",
    channels: ["urzad", "email"],
    sections: [
      { id: "dziecko", title: "Dziecko", fields: [child, childPesel, birth] },
      {
        id: "przychodnia",
        title: "Przychodnia",
        fields: [
          { id: "przychodnia", label: "Nazwa i adres przychodni", type: "textarea", required: true },
          { id: "lekarz", label: "Lekarz (pediatra)", type: "text", hint: "Możesz zostawić puste — przychodnia przydzieli lekarza" },
        ],
      },
      { id: "ty", title: "Opiekun", fields: [parent("Imię i nazwisko opiekuna"), parentPesel] },
    ],
  },
};

/** Formularz sprawy. Plan oczekiwanego dziecka ma te same sprawy z przedrostkiem „e-”. */
export function formFor(stopId: string): FormDef | undefined {
  return FORMS[stopId.replace(/^e-/, "")];
}
