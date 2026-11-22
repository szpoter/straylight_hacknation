import type { ApplicationFonts } from "../forms/application-pdf";
import { OLA } from "../family/ola";
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
  /** Nazwa druku, np. „Wniosek o świadczenie wychowawcze (SW-R)”. */
  name: string;
  /** Uwaga o wierności drukowi; pokazywana małym tekstem pod nagłówkiem. */
  fidelity: string;
  /** Gdzie trafia wniosek — kanały do wyboru przy „Przekaż”. */
  channels: Channel[];
  pdf: "none" | "letter" | "official";
  letter?: (values: Record<string, string>, dateISO: string) => string[];
  buildOfficial?: (values: Record<string, string>, dateISO: string, fonts: ApplicationFonts) => Promise<Uint8Array>;
  validate?: (values: Record<string, string>, todayISO: string) => Record<string, string>;
  validateChannel?: (values: Record<string, string>, channel: Channel) => Record<string, string>;
  bring?: string;
  sections: FormSection[];
};

type Delivery = { mode: "pdf" | "online" | "osobiscie"; label: string; hint: string; receipt?: string };

export const CHANNEL_LABEL = {
  pue: { mode: "online", label: "eZUS", hint: "Skorzystaj z konta w portalu ZUS.", receipt: "Urzędowe poświadczenie przedłożenia (UPP)" },
  mzus: { mode: "online", label: "mZUS", hint: "Skorzystaj z aplikacji mobilnej ZUS.", receipt: "Potwierdzenie złożenia wniosku w mZUS" },
  bank: { mode: "online", label: "Bankowość elektroniczna", hint: "Wybierz wniosek w banku obsługującym świadczenie.", receipt: "Potwierdzenie złożenia wniosku przez bank" },
  empatia: { mode: "online", label: "Emp@tia", hint: "Skorzystaj z portalu świadczeń dla rodzin.", receipt: "Potwierdzenie złożenia wniosku przez Emp@tię" },
  govpl: { mode: "online", label: "Formularz na gov.pl", hint: "Otwórz usługę na portalu gov.pl.", receipt: "Potwierdzenie na skrzynce e-Doręczeń" },
  mobywatel: { mode: "online", label: "mObywatel", hint: "Wybierz usługę w aplikacji mObywatel.", receipt: "Potwierdzenie zgłoszenia przez mObywatel" },
  ikp: { mode: "online", label: "Internetowe Konto Pacjenta", hint: "Wybierz deklarację na koncie pacjenta.", receipt: "Zapis deklaracji w IKP" },
  usc: { mode: "osobiscie", label: "Osobiście w USC", hint: "Zabierz dowód osobisty lub paszport do urzędu stanu cywilnego." },
  "usc-papier": { mode: "pdf", label: "Papierowo w USC", hint: "Podpisz wydruk i przekaż go w urzędzie stanu cywilnego." },
  pracodawca: { mode: "pdf", label: "Do pracodawcy (papier)", hint: "Podpisz wydruk i przekaż go do kadr." },
  email: { mode: "pdf", label: "E-mailem jako PDF", hint: "Przekaż dokument na adres uzgodniony z pracodawcą." },
  gmina: { mode: "pdf", label: "W gminie lub OPS", hint: "Złóż podpisany druk w jednostce wyznaczonej przez gminę." },
  poczta: { mode: "pdf", label: "Pocztą", hint: "Wyślij podpisany druk i wymagane załączniki do adresata." },
  przychodnia: { mode: "pdf", label: "W przychodni", hint: "Przekaż podpisaną deklarację wybranej przychodni." },
  zus: { mode: "pdf", label: "Papierowo w ZUS", hint: "Przekaż podpisany wniosek do ZUS." },
} as const satisfies Record<string, Delivery>;

export type Channel = keyof typeof CHANNEL_LABEL;

export type PrefillContext = {
  parentName: string;
  employer: string;
  childName?: string;
  secondParentName?: string;
  /** Data urodzenia (ISO), gdy dziecko jest na świecie. */
  birthDate?: string;
  /** Planowany termin porodu (ISO) dla planu oczekiwanego dziecka. */
  dueDate?: string;
};

/** Dane do podstawienia z planu i profilu demonstracyjnego (Profil → Moje dane). */
export function prefillContext(plan: Pick<Plan, "name" | "kind" | "keyDate"> & Partial<Pick<Plan, "id">>, profile: Pick<PrefillContext, "parentName" | "employer" | "secondParentName" | "childName" | "birthDate">): PrefillContext {
  const born = plan.kind !== "planowane";
  const childName = born ? plan.name.replace(/^Sprawa testowa · /, "").replace(/^Przykład · .*/, "") || undefined : undefined;
  const familyPlan = plan.id === "ola";
  return {
    ...profile,
    secondParentName: familyPlan ? profile.secondParentName ?? OLA.father : undefined,
    childName: familyPlan && (childName === "Ola" || childName === OLA.child) ? profile.childName ?? OLA.child : childName,
    birthDate: born ? (familyPlan ? profile.birthDate ?? plan.keyDate : plan.keyDate) : undefined,
    dueDate: born ? undefined : plan.keyDate,
  };
}

export const YES_NO = ["Tak", "Nie"];

// Pola powtarzane w wielu wnioskach.
export const parent = (label = "Imię i nazwisko"): FormField => ({ id: "rodzic", label, type: "text", required: true, prefill: (c) => c.parentName });
export const parentPesel: FormField = { id: "rodzic_pesel", label: "Twój numer PESEL", type: "pesel", required: true, hint: "11 cyfr" };
export const child: FormField = { id: "dziecko", label: "Imię i nazwisko dziecka", type: "text", required: true, prefill: (c) => c.childName };
export const childPesel: FormField = { id: "dziecko_pesel", label: "Numer PESEL dziecka", type: "pesel", required: true, hint: "Z odpisu aktu urodzenia albo z mObywatela" };
export const birth: FormField = { id: "data_urodzenia", label: "Data urodzenia dziecka", type: "date", required: true, prefill: (c) => c.birthDate };
export const employer: FormField = { id: "pracodawca", label: "Pracodawca", type: "text", required: true, prefill: (c) => c.employer };
export const payout: FormField[] = [
  { id: "wyplata", label: "Sposób wypłaty", type: "radio", required: true, options: ["Na rachunek bankowy", "Przekazem pocztowym"], prefill: () => "Na rachunek bankowy" },
  { id: "rachunek", label: "Numer rachunku", type: "account", required: true, hint: "26 cyfr, np. 12 3456 7890 1234 5678 9012 3456", showIf: { field: "wyplata", equals: "Na rachunek bankowy" } },
];
