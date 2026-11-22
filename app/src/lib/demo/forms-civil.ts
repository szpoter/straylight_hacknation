import { formatShort } from "../rules/dates";
import { POZ_CHOICES, POZ_MAP } from "../forms/poz-map";
import { birth, child, childPesel, parent, parentPesel, YES_NO, type FormDef, type FormField } from "./form-fields";

const text = (id: string, label: string, required = true): FormField => ({ id, label, required, type: "text" });
const choice = (id: string, label: string, options: string[]): FormField => ({ id, label, options, required: true, type: "select" });
const when = (fields: FormField[], field: string, equals: string): FormField[] => fields.map(f => ({ ...f, showIf: { field, equals } }));
const ELECTRONIC = "Na skrzynkę do e-Doręczeń";
const MAIL = "Pocztą na adres zamieszkania";
const receipt = choice("odbior", "Sposób odbioru", ["Osobiście w urzędzie", MAIL, ELECTRONIC]);
const birthplace = text("miejsce", "Miejscowość urodzenia dziecka");
const futureBirth = (v: Record<string, string>, today: string): Record<string, string> => v.data_urodzenia > today
  ? { data_urodzenia: "Data urodzenia nie może być w przyszłości." } : {};
const names: FormField[] = [
  { ...text("imiona", "Wybrane imię lub imiona dziecka"), hint: "Możesz wybrać jedno albo dwa imiona.", prefill: c => c.childName?.split(" ")[0] },
  text("nazwisko", "Nazwisko dziecka"),
];
const personal = (prefix: string): FormField[] => [
  text(prefix + "_rodowe", "Nazwisko rodowe"),
  { ...text(prefix + "_urodzenie", "Data urodzenia rodzica"), type: "date" },
  text(prefix + "_miejsce", "Miejscowość urodzenia rodzica"),
  text(prefix + "_obywatelstwo", "Obywatelstwo rodzica"),
];
const address = (prefix: string): FormField[] => [
  text(prefix + "_ulica", "Ulica (jeśli jest)", false),
  text(prefix + "_dom", "Numer domu i mieszkania"),
  text(prefix + "_miasto", "Kod pocztowy i miejscowość"),
];
const pozChoice = (id: string, label: string): FormField[] => [
  choice(id, label, POZ_CHOICES),
  ...when([text(id + "_opis", "Opisz przyczynę po stronie przychodni")], id, POZ_CHOICES[3]),
];
const EXEMPT = "Sprawa zwolniona z opłaty skarbowej";
const blank = "……………………";

export const civilForms: Record<string, FormDef> = {
  "zglos-urodzenie": {
    name: "Zgłoszenie urodzenia dziecka",
    pdf: "none",
    fidelity: "Zgłoszenie żywego urodzenia przez rodzica. Masz 21 dni od wystawienia karty urodzenia. Online potrzebujesz skrzynki do e-Doręczeń.",
    channels: ["govpl", "mobywatel", "usc"],
    bring: "Zabierz dowód osobisty lub paszport do USC miejsca urodzenia. Kartę urodzenia przekazuje placówka. Na miejscu sprawdzisz i podpiszesz protokół z kierownikiem USC.",
    sections: [
      { id: "dziecko", title: "Dziecko", fields: [
        ...names, birth, birthplace, text("placowka", "Placówka lub miejsce porodu"),
        choice("plec", "Płeć dziecka", ["Dziewczynka", "Chłopiec"]),
        text("obywatelstwo", "Obywatelstwo dziecka"),
      ] },
      { id: "ty", title: "Rodzic zgłaszający urodzenie", fields: [
        choice("rola", "Kto zgłasza urodzenie?", ["Matka", "Ojciec"]),
        parent(), { ...parentPesel, required: false, hint: "Podaj, jeśli nadano." }, ...personal("rodzic"),
      ] },
      { id: "drugi", title: "Drugi rodzic", fields: [
        { ...choice("dane_drugiego", "Czy ustalono dane drugiego rodzica?", YES_NO),
          hint: "Ojciec spoza małżeństwa może zgłosić dziecko po ustaleniu ojcostwa." },
        ...when([
          { ...text("drugi_rodzic", "Imię i nazwisko drugiego rodzica"), prefill: c => c.secondParentName },
          { ...parentPesel, id: "drugi_pesel", label: "PESEL drugiego rodzica (jeśli nadano)", required: false },
          ...personal("drugi"),
        ], "dane_drugiego", "Tak"),
        text("akt_rodzicow", "Miejsce sporządzenia i numer aktu małżeństwa lub aktów urodzenia rodziców (jeśli znane)", false),
      ] },
      { id: "adres", title: "Zameldowanie i odbiór dokumentów", fields: [
        text("zameldowanie", "Miejsce pobytu rodzica, u którego mieszka dziecko"),
        text("adres", "Adres korespondencyjny zgłaszającego"),
        { ...receipt, options: ["Osobiście w urzędzie", "Pocztą na adres korespondencyjny", ELECTRONIC] },
        text("email", "E-mail do kontaktu", false), text("telefon", "Telefon do kontaktu", false),
      ] },
    ],
    validate(v, today) {
      const errors = futureBirth(v, today);
      if (v.imiona?.trim().split(/\s+/).length > 2) errors.imiona = "Wpisz najwyżej dwa imiona.";
      if (v.rola === "Ojciec" && v.dane_drugiego === "Nie") errors.dane_drugiego = "Ojciec zgłaszający urodzenie podaje dane matki dziecka.";
      return errors;
    },
  },
  odpis: {
    name: "Wniosek o wydanie odpisu aktu urodzenia dziecka",
    pdf: "letter",
    fidelity: "Wniosek rodzica do dowolnego USC. Za egzemplarz odpisu skróconego lub wielojęzycznego zapłacisz 22 zł, a za zupełny 33 zł. W sprawach zwolnionych ustawowo opłata wynosi 0 zł.",
    channels: ["govpl", "usc-papier", "poczta"],
    receipts: { govpl: "Potwierdzenie na skrzynce e-Doręczeń (UPP)" },
    recipientFor: v => v.urzad || "Wybrany urząd stanu cywilnego",
    bring: "Podpisz wniosek. Przy sprawie płatnej dołącz potwierdzenie opłaty. Na wizytę w USC zabierz dowód osobisty lub paszport.",
    sections: [
      { id: "ty", title: "Rodzic i urząd", fields: [
        parent(), text("adres", "Adres zamieszkania rodzica"), text("urzad", "Nazwa i miejscowość wybranego USC"),
      ] },
      { id: "akt", title: "Akt urodzenia dziecka", fields: [child, birth, birthplace,
        text("numer_aktu", "Numer aktu (jeśli znasz)", false),
      ] },
      { id: "odpis", title: "Odpis i opłata", fields: [
        { ...choice("rodzaj", "Rodzaj odpisu", ["Skrócony", "Zupełny", "Wielojęzyczny"]), prefill: () => "Skrócony" },
        { ...text("liczba", "Liczba egzemplarzy"), prefill: () => "1" },
        receipt, ...when([text("ade", "Twój adres do e-Doręczeń")], "odbior", ELECTRONIC),
        choice("oplata", "Czy sprawa podlega opłacie?", ["Sprawa płatna", EXEMPT]),
        { ...text("cel", "Do jakiej sprawy potrzebujesz odpisu?"), hint: "Przy zwolnieniu wskaż konkretny cel, np. postępowanie o zasiłek w ZUS." },
      ] },
    ],
    validate(v, today) {
      const errors = futureBirth(v, today);
      if (v.liczba && (!/^[1-9]\d*$/.test(v.liczba) || !Number.isSafeInteger(Number(v.liczba) * 33))) errors.liczba = "Podaj dodatnią, całkowitą liczbę egzemplarzy.";
      if (v.rodzaj === "Wielojęzyczny" && v.odbior === ELECTRONIC) errors.odbior = "Odpis wielojęzyczny otrzymasz tylko na papierze. Wybierz urząd lub pocztę.";
      return errors;
    },
    letter(v) {
      const copies: Record<string, string> = { Skrócony: "skrócony", Zupełny: "zupełny", Wielojęzyczny: "skrócony na druku wielojęzycznym" };
      const fee = Number(v.liczba) * (v.rodzaj === "Zupełny" ? 33 : 22);
      return [
        `Adres wnioskodawcy: ${v.adres || blank}.`,
        `Jako rodzic proszę o odpis ${copies[v.rodzaj] || blank} aktu urodzenia mojego dziecka. Liczba egzemplarzy: ${v.liczba || blank}.`,
        `Imię i nazwisko dziecka: ${v.dziecko || blank}. Data i miejsce urodzenia: ${v.data_urodzenia ? formatShort(v.data_urodzenia) : blank}, ${v.miejsce || blank}.` + (v.numer_aktu ? ` Numer aktu: ${v.numer_aktu}.` : ""),
        `Cel wydania odpisu: ${v.cel || blank}.`,
        `Sposób odbioru: ${v.odbior || blank}` + (v.odbior === ELECTRONIC ? ` (${v.ade || blank})` : v.odbior === MAIL ? ` (${v.adres || blank})` : "") + ".",
        v.oplata === EXEMPT ? "Wnoszę o wydanie odpisu bez opłaty skarbowej ze względu na wskazany cel. Załączniki: brak."
          : `Załącznik: potwierdzenie wniesienia opłaty skarbowej${v.rodzaj && v.liczba && Number.isSafeInteger(fee) && fee > 0 ? ` w wysokości ${fee} zł` : ""}.`,
      ];
    },
  },
  poz: {
    name: "Deklaracja wyboru przychodni i osoby sprawującej opiekę POZ",
    pdf: "official",
    fidelity: "Osobną deklarację składasz dla lekarza, pielęgniarki lub położnej. Papierowy druk podpisuje przedstawiciel ustawowy. Przesyłając go elektronicznie do placówki, użyj podpisu zaufanego, osobistego albo kwalifikowanego i uzgodnionego adresu.",
    channels: ["ikp", "przychodnia", "email"],
    recipientFor: v => v.przychodnia || "Wybrana przychodnia POZ",
    bring: "Podpisz deklarację odręcznie na wydruku lub elektronicznie podpisem zaufanym, osobistym albo kwalifikowanym. Wzór dla rodzica nie wymaga załączników.",
    buildOfficial: async (values, date, fonts) => (await import("../forms/poz-fill")).buildPoz(values, date, fonts),
    sections: [
      { id: "dziecko", title: "Dane dziecka", fields: [
        choice("medyk", "Dla kogo składasz deklarację wyboru?", Object.keys(POZ_MAP)),
        { ...text("imie", "Imię dziecka"), prefill: c => c.childName?.split(" ")[0] },
        { ...text("nazwisko", "Nazwisko dziecka"), prefill: c => c.childName?.split(" ").slice(1).join(" ") },
        birth, { ...choice("identyfikator", "Identyfikator dziecka", ["PESEL", "Dokument tożsamości"]), prefill: () => "PESEL" },
        ...when([{ ...childPesel, hint: "Podaj 11 cyfr." }], "identyfikator", "PESEL"),
        ...when([text("dokument", "Seria i numer dokumentu dziecka (gdy nie ma PESEL)")], "identyfikator", "Dokument tożsamości"),
        ...address("dziecko"), text("telefon", "Telefon kontaktowy", false), text("email", "E-mail", false),
      ] },
      { id: "opiekun", title: "Przedstawiciel ustawowy", fields: [
        { ...text("opiekun_imie", "Imię przedstawiciela"), prefill: c => c.parentName.split(" ")[0] },
        { ...text("opiekun_nazwisko", "Nazwisko przedstawiciela"), prefill: c => c.parentName.split(" ").slice(1).join(" ") },
        text("opiekun_telefon", "Telefon przedstawiciela", false), ...address("opiekun"),
        { ...choice("drugi_opiekun", "Czy wpisujesz drugiego przedstawiciela?", YES_NO), prefill: () => "Nie" },
        ...when([text("drugi_imie", "Imię drugiego przedstawiciela"), text("drugi_nazwisko", "Nazwisko drugiego przedstawiciela"),
          text("drugi_telefon", "Telefon drugiego przedstawiciela", false), ...address("drugi")], "drugi_opiekun", "Tak"),
      ] },
      { id: "przychodnia", title: "Wybór w bieżącym roku", fields: [
        text("przychodnia", "Nazwa świadczeniodawcy"), text("adres_przychodni", "Adres siedziby świadczeniodawcy"),
        ...pozChoice("wybor_przychodni", "Który raz wybierasz przychodnię w tym roku?"),
        text("lekarz", "Imię i nazwisko wybranego lekarza, pielęgniarki lub położnej"),
        ...pozChoice("wybor_medyka", "Który raz w tym roku wybierasz osobę w tej roli?"),
      ] },
    ],
    validate(v, today) {
      const errors = futureBirth(v, today);
      if (v.telefon && !/^\+?\d{1,13}$/.test(v.telefon.replace(/[\s()-]/g, ""))) errors.telefon = "Podaj numer telefonu z opcjonalnym prefiksem kraju.";
      if ((v.telefon ?? "").replace(/[\s()-]/g, "").length > 13) errors.telefon = "W druku jest miejsce na 13 znaków numeru telefonu.";
      if (v.identyfikator === "Dokument tożsamości" && (v.dokument ?? "").replace(/\s/g, "").length > 22) errors.dokument = "Na druku zmieszczą się 22 znaki dokumentu.";
      return errors;
    },
  },
};
