import { formatShort } from "../rules/dates";
import { POZ_CHOICES, POZ_MAP } from "../forms/poz-map";
import { birth, child, childPesel, parent, parentPesel, YES_NO, type FormDef, type FormField } from "./form-fields";

const text = (id: string, label: string, required = true): FormField => ({ id, label, required, type: "text" });
const choice = (id: string, label: string, options: string[]): FormField => ({ id, label, options, required: true, type: "select" });
const when = (fields: FormField[], field: string, equals: string): FormField[] => fields.map(f => ({ ...f, showIf: { field, equals } }));
const ELECTRONIC = "Na skrzynkę do e-Doręczeń";
const MAIL = "Pocztą na adres zamieszkania";
const MAIL_OTHER = "Pocztą na inny adres do korespondencji";
const receipt = choice("odbior", "Sposób odbioru", ["Osobiście w urzędzie", MAIL, MAIL_OTHER, ELECTRONIC]);
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
const PAID = "Sprawa płatna";
const ONLINE_PAYMENT = "Płatność online w usłudze gov.pl";
const TRANSFER = "Przelew bankowy lub pocztowy z potwierdzeniem";
const TRUSTED = "Podpis zaufany";
const QUALIFIED = "Podpis kwalifikowany";
const personalSignature = "Podpis osobisty";
const loginOptions = ["Profil zaufany", "E-dowód z czytnikiem i potwierdzonym profilem zaufanym"];
const optionalChoice = (id: string, label: string, options: string[]): FormField => ({ ...choice(id, label, options), required: false });
const stampDuty = (v: Record<string, string>) => Number(v.liczba) * (v.rodzaj === "Zupełny" ? 33 : 22);
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
    fidelity: "Na gov.pl składasz formularz elektroniczny. PDF do złożenia osobiście lub pocztą to pismo pomocnicze rodzica. Wybrany USC może udostępniać własny wzór.",
    channels: ["govpl", "usc-papier", "poczta"],
    receipts: { govpl: "Potwierdzenie na skrzynce e-Doręczeń (UPP)" },
    recipientFor: v => v.urzad || "Wybrany urząd stanu cywilnego",
    channelInfo(v, channel) {
      if (v.oplata === EXEMPT) return "Zwolnienie z opłaty ze względu na wskazany cel. Do zapłaty 0 zł.";
      const fee = stampDuty(v);
      if (v.oplata !== PAID || !v.rodzaj || !Number.isSafeInteger(fee) || fee < 1) return;
      if (channel === "govpl" && !v.platnosc) return `Opłata skarbowa wynosi ${fee} zł. Przy płatności online operator doliczy 0,59 zł.`;
      if (channel !== "govpl" || v.platnosc !== ONLINE_PAYMENT) return `Opłata skarbowa wynosi ${fee} zł. Dołącz potwierdzenie opłaty.`;
      const automatic = v.odbior === ELECTRONIC && v.rodzaj !== "Wielojęzyczny"
        ? " Gov.pl może wydać odpis aktu Twojego dziecka automatycznie na skrzynkę do e-Doręczeń, jeśli system potwierdzi dane w rejestrze i pozostałe warunki. Taki odpis ma pieczęć ministra cyfryzacji." : "";
      return `Do zapłaty ${fee},59 zł, w tym ${fee} zł opłaty skarbowej i 0,59 zł prowizji operatora za płatność.${automatic}`;
    },
    validateChannel(v, channel) {
      const errors: Record<string, string> = {};
      if (channel !== "govpl") return errors;
      if (!loginOptions.includes(v.logowanie)) errors.logowanie = "Wybierz metodę logowania w symulacji gov.pl.";
      if (v.oplata === PAID && ![ONLINE_PAYMENT, TRANSFER].includes(v.platnosc)) errors.platnosc = "Wybierz sposób zapłaty za odpis w symulacji gov.pl.";
      if (![TRUSTED, QUALIFIED].includes(v.podpis)) errors.podpis = "Wybierz podpis w symulacji gov.pl.";
      if (v.oplata === PAID && v.platnosc === ONLINE_PAYMENT && v.podpis === QUALIFIED) errors.podpis = "Przy płatności online wybierz podpis zaufany. Podpis kwalifikowany jest dostępny przy przelewie.";
      return errors;
    },
    bring: "Podpisz wniosek. Przy sprawie płatnej dołącz potwierdzenie opłaty. Na wizytę w USC zabierz dowód osobisty lub paszport.",
    sections: [
      { id: "logowanie", title: "Wejście do usługi gov.pl", fields: [
        { ...optionalChoice("logowanie", "Jak zalogujesz się w symulacji gov.pl?", loginOptions), hint: "Wybierz samą metodę. Przy wniosku papierowym pomiń ten krok." },
      ] },
      { id: "ty", title: "Rodzic i urząd", fields: [
        parent(), text("adres", "Adres zamieszkania rodzica"), text("urzad", "Nazwa i miejscowość wybranego USC"),
      ] },
      { id: "akt", title: "Akt urodzenia dziecka", fields: [child, birth, birthplace,
        { ...childPesel, required: false, hint: "Jeśli znasz numer, pomoże odszukać akt." },
        text("usc_aktu", "USC, który sporządził akt", false),
        text("numer_aktu", "Numer aktu (jeśli znasz)", false),
      ] },
      { id: "odpis", title: "Odpis i opłata", fields: [
        { ...choice("rodzaj", "Rodzaj odpisu", ["Skrócony", "Zupełny", "Wielojęzyczny"]), prefill: () => "Skrócony" },
        { ...text("liczba", "Liczba egzemplarzy"), prefill: () => "1" },
        receipt, ...when([text("ade", "Twój adres do e-Doręczeń")], "odbior", ELECTRONIC),
        ...when([text("adres_pocztowy", "Adres do korespondencji")], "odbior", MAIL_OTHER),
        choice("oplata", "Czy sprawa podlega opłacie?", [PAID, EXEMPT]),
        { ...text("cel", "Do jakiej sprawy potrzebujesz odpisu?"), hint: "Przy zwolnieniu wskaż konkretny cel, np. postępowanie o zasiłek w ZUS." },
      ] },
      { id: "podpisanie", title: "Płatność i podpis w symulacji gov.pl", fields: [
        ...when([{ ...optionalChoice("platnosc", "Jak opłacisz wniosek na gov.pl?", [ONLINE_PAYMENT, TRANSFER]),
          hint: "22 zł za odpis skrócony lub wielojęzyczny, 33 zł za zupełny. Przy płatności online bank i urząd muszą obsługiwać usługę, a operator dolicza 0,59 zł za transakcję. Przy przelewie dołączasz potwierdzenie." }], "oplata", PAID),
        { ...optionalChoice("podpis", "Jak podpiszesz wniosek na gov.pl?", [TRUSTED, QUALIFIED]), hint: "Płatność online wymaga podpisu zaufanego. Przy przelewie lub zwolnieniu możesz też wybrać podpis kwalifikowany." },
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
      const fee = stampDuty(v);
      return [
        "Pismo pomocnicze rodzica do urzędu stanu cywilnego.",
        `Adres wnioskodawcy: ${v.adres || blank}.`,
        `Jako rodzic proszę o odpis ${copies[v.rodzaj] || blank} aktu urodzenia mojego dziecka. Liczba egzemplarzy: ${v.liczba || blank}.`,
        `Imię i nazwisko dziecka: ${v.dziecko || blank}. Data i miejsce urodzenia: ${v.data_urodzenia ? formatShort(v.data_urodzenia) : blank}, ${v.miejsce || blank}.` + (v.numer_aktu ? ` Numer aktu: ${v.numer_aktu}.` : ""),
        ...(v.dziecko_pesel ? [`PESEL dziecka: ${v.dziecko_pesel}.`] : []),
        ...(v.usc_aktu ? [`USC, który sporządził akt: ${v.usc_aktu}.`] : []),
        `Cel wydania odpisu: ${v.cel || blank}.`,
        `Sposób odbioru: ${[v.odbior || blank, v.odbior === ELECTRONIC && v.ade, v.odbior === MAIL && v.adres, v.odbior === MAIL_OTHER && v.adres_pocztowy].filter(Boolean).join(", ")}.`,
        v.oplata === EXEMPT ? "Wnoszę o wydanie odpisu bez opłaty skarbowej ze względu na wskazany cel. Załączniki: brak."
          : `Załącznik: potwierdzenie wniesienia opłaty skarbowej${v.rodzaj && v.liczba && Number.isSafeInteger(fee) && fee > 0 ? ` w wysokości ${fee} zł` : ""}.`,
      ];
    },
  },
  poz: {
    name: "Deklaracja wyboru przychodni i osoby sprawującej opiekę POZ",
    pdf: "official",
    fidelity: "Osobną deklarację składasz dla lekarza, pielęgniarki lub położnej. Papierowy druk podpisuje przedstawiciel ustawowy. Jeśli wysyłasz go elektronicznie, podpisz go podpisem zaufanym, osobistym albo kwalifikowanym i wyślij na adres uzgodniony z placówką.",
    channels: ["ikp", "przychodnia", "podpis-elektroniczny"],
    validateChannel(v, channel) {
      const errors: Record<string, string> = {};
      if (channel === "ikp" && v.dostep_ikp !== "Tak") errors.dostep_ikp = "Do wysłania przez IKP potrzebujesz dostępu do konta dziecka. Zaznacz, że go masz, albo wybierz „W przychodni”.";
      if (channel === "ikp" && v.identyfikator === "Dokument tożsamości") errors.identyfikator = "IKP dziecka działa tylko z nadanym numerem PESEL. Jeśli podajesz dokument tożsamości, przekaż deklarację bezpośrednio do przychodni.";
      if (channel === "podpis-elektroniczny" && ![TRUSTED, personalSignature, QUALIFIED].includes(v.podpis_poz)) errors.podpis_poz = "Wybierz podpis zaufany, osobisty lub kwalifikowany dla dokumentu do przychodni.";
      return errors;
    },
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
      { id: "online", title: "Elektroniczne przekazanie deklaracji", fields: [
        { ...optionalChoice("dostep_ikp", "Czy masz dostęp do konta dziecka w IKP?", YES_NO),
          hint: "Dostęp uzyskuje rodzic zgłaszający dziecko do ubezpieczenia w ZUS lub KRUS albo drugi rodzic z upoważnieniem. Aktualizacja w IKP może potrwać do 21 dni." },
        { ...optionalChoice("podpis_poz", "Jak podpiszesz dokument przesyłany bezpośrednio do przychodni?", [TRUSTED, personalSignature, QUALIFIED]),
          hint: "Uzgodnij elektroniczną drogę z placówką. W IKP wystarczy zatwierdzić deklarację, a papier podpisujesz odręcznie." },
      ] },
    ],
    validate(v, today) {
      const errors = futureBirth(v, today);
      if (v.telefon && !/^\+?\d{1,13}$/.test(v.telefon.replace(/[\s()-]/g, ""))) errors.telefon = "Wpisz numer telefonu, np. 600 100 200 albo +48 600 100 200.";
      if ((v.telefon ?? "").replace(/[\s()-]/g, "").length > 13) errors.telefon = "W druku jest miejsce na 13 znaków numeru telefonu.";
      if (v.identyfikator === "Dokument tożsamości" && (v.dokument ?? "").replace(/\s/g, "").length > 22) errors.dokument = "Na druku zmieszczą się 22 znaki dokumentu.";
      return errors;
    },
  },
};
