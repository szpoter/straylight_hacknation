/**
 * Dane fikcyjne do makiet i demo (wspólny przykład z ui/MACIEJ.md): dzień demo 21.11.2026,
 * Ola urodzona 10.11.2026, etap „Narodziny”. Wyłącznie dane fikcyjne.
 * TODO(backend): zastąpić danymi z API, zachowując typy z `types.ts`.
 */
import type { CalculatorPlan, Plan, ProfileRow, StageId, Stop } from "./types";

const STAGES: Plan["stages"] = {
  przed: { label: "Przed narodzinami" },
  ciaza: { label: "Ciąża" },
  narodziny: { label: "Narodziny" },
  po: { label: "Po narodzinach" },
};

const SRC = {
  usc: { label: "gov.pl · Zgłoś urodzenie dziecka", url: "https://www.gov.pl/web/gov/zglos-urodzenie-dziecka" },
  zusDocs: { label: "zus.pl · Zasiłek macierzyński — niezbędne dokumenty", url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/niezbedne-dokumenty" },
  zusAmount: { label: "zus.pl · Wysokość zasiłku macierzyńskiego", url: "https://www.zus.pl/pl/swiadczenia/zasilki/zasilek-macierzynski/wysokosc" },
  nfzInsurance: { label: "pacjent.gov.pl · Jak ubezpieczyć członka rodziny", url: "https://pacjent.gov.pl/artykul/jak-ubezpieczyc-czlonka-rodziny" },
  plus800: { label: "zus.pl · Termin złożenia wniosku o 800+", url: "https://www.zus.pl/en/-/termin-z%C5%82o%C5%BCenia-wniosku-o-800-plus-ma-znaczenie" },
  becikowe: { label: "gov.pl · Uzyskaj becikowe", url: "https://www.gov.pl/web/gov/uzyskaj-becikowe" },
  poz: { label: "pacjent.gov.pl · Wybierz dziecku lekarza rodzinnego", url: "https://pacjent.gov.pl/aktualnosc/wybierz-dziecku-lekarza-rodzinnego" },
  prenatal: { label: "pacjent.gov.pl · Program badań prenatalnych", url: "https://pacjent.gov.pl/program-profilaktyczny/program-badan-prenatalnych" },
  screening: { label: "przesiew.imid.med.pl · Badania przesiewowe noworodków", url: "https://przesiew.imid.med.pl/" },
  vaccines: { label: "pacjent.gov.pl · Kalendarz szczepień 2026", url: "https://pacjent.gov.pl/kalendarz-szczepien-dzieci-i-mlodziezy-na-2026-rok" },
  parental: { label: "gov.pl · Urlop rodzicielski", url: "https://www.gov.pl/web/rodzina/urlop-rodzicielski" },
  aktywny: { label: "gov.pl · Program Aktywny Rodzic", url: "https://www.gov.pl/web/rodzina/pytania-i-odpowiedzi---program-aktywny-rodzic" },
  pip: { label: "pip.gov.pl · Uprawnienia rodzicielskie", url: "https://www.pip.gov.pl/" },
};

function olaStops(): Stop[] {
  return [
    // Przed narodzinami
    {
      id: "ubezpieczenie",
      stage: "przed",
      title: "Sprawdź swoje ubezpieczenie chorobowe",
      kind: "informacja",
      checked: true,
      institution: "ZUS",
      forWhom: "Dla Ciebie",
      why: "Zasiłek macierzyński przysługuje, jeśli w dniu porodu masz ubezpieczenie chorobowe — bez względu na to, jak długo trwa.",
      source: SRC.zusAmount,
      action: { label: "Zobacz szczegóły" },
    },
    {
      id: "wysokosc",
      stage: "przed",
      title: "Od czego zależy wysokość zasiłku",
      kind: "informacja",
      checked: true,
      institution: "ZUS",
      forWhom: "Dla Ciebie",
      why: "Szacunek z Twoich podstaw składek w ZUS. Przy umowie o pracę składniki wynagrodzenia poda pracodawca w Z-3.",
      source: SRC.zusAmount,
      action: { label: "Otwórz kalkulator", href: "#kalkulator" },
    },
    // Ciąża
    {
      id: "badania-prenatalne",
      stage: "ciaza",
      substage: "I trymestr",
      title: "Badania prenatalne",
      kind: "program-zdrowotny",
      checked: true,
      institution: "NFZ",
      forWhom: "Dla Ciebie",
      why: "Bezpłatne USG w 11–14 i 18–22+6 tygodniu oraz badania biochemiczne dla wszystkich ciężarnych.",
      source: SRC.prenatal,
      action: { label: "Sprawdź, gdzie wykonać badanie" },
    },
    {
      id: "chorobowy-ciaza",
      stage: "ciaza",
      substage: "II trymestr",
      title: "Zasiłek chorobowy w ciąży",
      kind: "na-wniosek",
      state: "zalatwione",
      institution: "ZUS",
      forWhom: "Dla Ciebie",
      why: "Zwolnienie z kodem „B” daje zasiłek 100% przez okres zasiłkowy do 270 dni.",
      source: SRC.zusDocs,
      action: { label: "Zobacz szczegóły" },
      doc: { goal: "swiadczenia", recipient: "ZUS", result: "Świadczenie wypłacone", lastEvent: "Wypłacono 30 września 2026" },
    },
    {
      id: "macierzynski-przed",
      stage: "ciaza",
      substage: "III trymestr",
      title: "Urlop macierzyński przed porodem",
      kind: "na-wniosek",
      state: "nie-korzystam",
      institution: "Pracodawca",
      forWhom: "Dla Ciebie",
      why: "Najwyżej 6 tygodni przed przewidywaną datą porodu. Ten czas zmniejsza urlop po porodzie.",
      source: SRC.zusDocs,
      action: { label: "Zobacz szczegóły" },
    },
    {
      id: "zaplanuj-urlopy",
      stage: "ciaza",
      substage: "III trymestr",
      title: "Zaplanuj urlopy i sposób wypłaty",
      kind: "informacja",
      checked: true,
      institution: "Ty i drugi rodzic",
      forWhom: "Dla Was obojga",
      why: "Wniosek o wypłatę 81,5% za cały okres składa się do 21 dni po porodzie.",
      source: SRC.zusAmount,
      action: { label: "Otwórz kalkulator", href: "#kalkulator" },
    },
    // Narodziny
    {
      id: "przesiewowe",
      stage: "narodziny",
      title: "Badania przesiewowe noworodka",
      kind: "program-zdrowotny",
      checked: true,
      institution: "Szpital",
      forWhom: "Dla Oli",
      why: "Program badań przesiewowych noworodków wykonuje szpital po porodzie.",
      source: SRC.screening,
      action: { label: "Zobacz szczegóły" },
    },
    {
      id: "z3",
      stage: "narodziny",
      title: "Pracodawca przekaże Z-3 do ZUS",
      kind: "dzieje-sie-samo",
      institution: "Pracodawca",
      forWhom: "Dla Ciebie",
      why: "Pracodawca do 20 ubezpieczonych przekazuje zaświadczenie o wynagrodzeniu do ZUS razem z Twoim wnioskiem.",
      whoDoesIt: "Pracodawca",
      source: SRC.zusDocs,
      action: { label: "Zobacz szczegóły" },
    },
    {
      id: "zglos-urodzenie",
      stage: "narodziny",
      title: "Zgłoś urodzenie Oli",
      kind: "obowiazek",
      state: "aktualna",
      parallelWith: "zasilek-macierzynski",
      due: "2026-12-01",
      dueBasis: "21 dni od wystawienia karty urodzenia (10 listopada 2026)",
      institution: "Urząd stanu cywilnego",
      forWhom: "Dla Oli",
      why: "Zgłoszenie urodzenia nadaje dziecku numer PESEL. Bez niego nie zgłosisz Oli do ubezpieczenia ani nie złożysz wniosku o 800+.",
      prepare: ["Karta urodzenia (szpital przekazuje ją do USC)", "Dowód osobisty", "Profil zaufany lub e-dowód, jeśli zgłaszasz online", "Adres do e-Doręczeń przy zgłoszeniu online"],
      howTo: {
        co: "Zgłoszenie urodzenia dziecka",
        doKogo: "Dowolny urząd stanu cywilnego albo online na gov.pl",
        doKiedy: "1 grudnia 2026 · 21 dni od wystawienia karty urodzenia",
        zalaczniki: "Brak, kartę urodzenia przekazuje szpital",
      },
      source: SRC.usc,
      action: { label: "Zobacz, jak zgłosić" },
      doc: { goal: "rejestracja", recipient: "Urząd stanu cywilnego", note: "Bezpłatnie, w urzędzie albo online" },
    },
    {
      id: "zasilek-macierzynski",
      stage: "narodziny",
      title: "Wniosek o zasiłek macierzyński 81,5%",
      kind: "na-wniosek",
      state: "szkic",
      parallelWith: "zglos-urodzenie",
      due: "2026-12-01",
      dueBasis: "21 dni od porodu",
      institution: "Pracodawca",
      forWhom: "Dla Ciebie",
      why: "Wniosek o 81,5% za cały okres trzeba złożyć do 21 dni po porodzie. Później zostaje wariant 100%, potem 70%.",
      prepare: ["Dane Oli: imię, nazwisko, PESEL, data i miejsce urodzenia (po zgłoszeniu urodzenia)", "Dane pracodawcy"],
      howTo: {
        co: "Wniosek o zasiłek macierzyński w wysokości 81,5%",
        doKogo: "Pracodawca · zatrudnia do 20 osób, więc przekaże wniosek i Z-3 do ZUS",
        doKiedy: "1 grudnia 2026 · 21 dni od porodu",
        zalaczniki: "Brak — we wniosku podajesz dane Oli",
      },
      source: SRC.zusDocs,
      action: { label: "Dokończ z Zusikiem", href: "/dokumenty/zasilek-macierzynski" },
      doc: { goal: "swiadczenia", recipient: "Do pracodawcy", note: "Brakuje numeru PESEL Oli", hasDraft: true },
    },
    {
      id: "urlop-macierzynski",
      stage: "narodziny",
      title: "Wniosek o urlop macierzyński",
      kind: "na-wniosek",
      state: "wyslano",
      institution: "Pracodawca",
      forWhom: "Dla Ciebie",
      why: "Urlop macierzyński trwa 20 tygodni przy jednym dziecku. Co najmniej 14 tygodni po porodzie wykorzystuje matka.",
      howTo: {
        co: "Wniosek o udzielenie urlopu macierzyńskiego",
        doKogo: "Pracodawca",
        doKiedy: "Po porodzie, przed rozpoczęciem urlopu",
        zalaczniki: "Brak",
      },
      source: SRC.zusDocs,
      action: { label: "Zobacz przebieg sprawy", href: "/dokumenty/urlop-macierzynski" },
      doc: {
        goal: "urlopy",
        recipient: "Do pracodawcy",
        lastEvent: "Przekazano 12 listopada 2026",
        events: [{ date: "2026-11-12", title: "Wysłano w symulacji", detail: "Przekazano pracodawcy przez e-mail kadr." }],
      },
    },
    {
      id: "ubezpieczenie-dziecka",
      stage: "narodziny",
      title: "Zgłoś Olę do ubezpieczenia zdrowotnego",
      kind: "obowiazek",
      state: "warunek",
      condition: "Po nadaniu numeru PESEL",
      dueBasis: "7 dni od nadania numeru PESEL",
      institution: "Pracodawca",
      forWhom: "Dla Oli",
      why: "Rejestracja urodzenia nie zgłasza dziecka automatycznie. Jako pracownica zgłaszasz Olę przez pracodawcę.",
      howTo: {
        co: "Zgłoszenie członka rodziny do ubezpieczenia zdrowotnego",
        doKogo: "Pracodawca (przedsiębiorca sam, na ZUS ZCNA)",
        doKiedy: "7 dni od nadania numeru PESEL",
        zalaczniki: "Numer PESEL dziecka",
      },
      source: SRC.nfzInsurance,
      action: { label: "Zobacz, co przygotować" },
      doc: { goal: "rejestracja", recipient: "Do pracodawcy", note: "Po nadaniu numeru PESEL" },
    },
    {
      id: "odpis",
      stage: "narodziny",
      title: "Zamów odpis aktu urodzenia",
      kind: "na-wniosek",
      state: "warunek",
      condition: "Po zgłoszeniu urodzenia",
      institution: "Urząd stanu cywilnego",
      forWhom: "Dla Oli",
      why: "Odpis przyda się w sytuacjach szczególnych, np. przy uzupełniającym urlopie macierzyńskim. Przy zwykłym wniosku o zasiłek wystarczą dane dziecka.",
      source: SRC.usc,
      action: { label: "Zobacz, co przygotować" },
      doc: { goal: "rejestracja", recipient: "Urząd stanu cywilnego", note: "Po zgłoszeniu urodzenia", optional: true },
    },
    {
      id: "urlop-ojcowski",
      stage: "narodziny",
      title: "Urlop ojcowski",
      kind: "na-wniosek",
      state: "szkic",
      institution: "Pracodawca drugiego rodzica",
      forWhom: "Dla drugiego rodzica",
      why: "2 tygodnie płatne 100%, do 12. miesiąca życia Oli. Nie zużywa puli urlopu rodzicielskiego.",
      dueBasis: "Wniosek co najmniej 7 dni przed rozpoczęciem",
      howTo: {
        co: "Wniosek o urlop ojcowski",
        doKogo: "Pracodawca drugiego rodzica",
        doKiedy: "Co najmniej 7 dni przed rozpoczęciem, najpóźniej do 10 listopada 2027",
        zalaczniki: "Brak — we wniosku podajesz dane Oli",
      },
      source: SRC.zusDocs,
      action: { label: "Dokończ z Zusikiem", href: "/dokumenty/urlop-ojcowski" },
      doc: { goal: "urlopy", recipient: "Do pracodawcy", note: "Brakuje daty rozpoczęcia", optional: true, hasDraft: true },
    },
    // Po narodzinach
    {
      id: "800plus",
      stage: "po",
      title: "Wniosek o 800+",
      kind: "na-wniosek",
      state: "wyslano",
      institution: "ZUS",
      forWhom: "Dla Oli",
      why: "Wniosek złożony do 3 miesięcy od urodzenia daje wypłatę od dnia urodzenia.",
      howTo: { co: "Wniosek SW-R o świadczenie wychowawcze", doKogo: "ZUS, wyłącznie elektronicznie", doKiedy: "10 lutego 2027 · 3 miesiące od urodzenia", zalaczniki: "Brak" },
      source: SRC.plus800,
      action: { label: "Zobacz przebieg sprawy", href: "/dokumenty/800plus" },
      doc: {
        goal: "swiadczenia",
        recipient: "Do ZUS",
        lastEvent: "Potwierdzono wpływ 15 listopada 2026",
        events: [
          { date: "2026-11-15", title: "Wysłano w symulacji", detail: "Wniosek SW-R przez eZUS." },
          { date: "2026-11-15", title: "Potwierdzenie wpływu", detail: "UPP z eZUS." },
        ],
      },
    },
    {
      id: "poz",
      stage: "po",
      title: "Wybierz przychodnię dla Oli",
      kind: "na-wniosek",
      state: "warunek",
      condition: "Po nadaniu numeru PESEL",
      institution: "Przychodnia lub IKP",
      forWhom: "Dla Oli",
      why: "Deklarację wyboru lekarza POZ złożysz na koncie dziecka w IKP albo w przychodni.",
      source: SRC.poz,
      action: { label: "Zobacz, co przygotować" },
      doc: { goal: "zdrowie", recipient: "Przychodnia", note: "Po nadaniu numeru PESEL" },
    },
    {
      id: "rodzicielski",
      stage: "po",
      title: "Urlop rodzicielski",
      kind: "na-wniosek",
      state: "warunek",
      condition: "Po urlopie macierzyńskim · od 30 marca 2027",
      dueBasis: "Wniosek co najmniej 21 dni przed rozpoczęciem",
      institution: "Pracodawca",
      forWhom: "Dla Was obojga",
      why: "41 tygodni dla rodziców, po 9 tygodni zastrzeżone dla każdego z Was.",
      source: SRC.parental,
      action: { label: "Otwórz kalkulator", href: "#kalkulator" },
      doc: { goal: "urlopy", recipient: "Do pracodawcy", note: "Wniosek do 9 marca 2027" },
    },
    {
      id: "szczepienia",
      stage: "po",
      title: "Kalendarz szczepień",
      kind: "program-zdrowotny",
      institution: "Przychodnia",
      forWhom: "Dla Oli",
      why: "Program szczepień ochronnych na 2026 rok.",
      source: SRC.vaccines,
      action: { label: "Zobacz kalendarz" },
    },
    {
      id: "becikowe",
      stage: "po",
      title: "Becikowe",
      kind: "na-wniosek",
      state: "warunek",
      condition: "Po zgłoszeniu urodzenia",
      dueBasis: "Do 12 miesięcy od urodzenia",
      institution: "Urząd gminy",
      forWhom: "Dla Oli",
      why: "1000 zł przy dochodzie do 1922 zł netto na osobę i opiece medycznej od 10. tygodnia ciąży.",
      source: SRC.becikowe,
      action: { label: "Zobacz, co przygotować" },
      doc: { goal: "swiadczenia", recipient: "Urząd gminy", note: "Do 10 listopada 2027", optional: true },
    },
    {
      id: "aktywny-rodzic",
      stage: "po",
      title: "Aktywny Rodzic",
      kind: "informacja",
      institution: "ZUS",
      forWhom: "Dla Oli",
      why: "Świadczenie dla dziecka w wieku 12–35 miesięcy, zależnie od tego, czy wracasz do pracy.",
      source: SRC.aktywny,
      action: { label: "Zobacz szczegóły" },
    },
    {
      id: "powrot",
      stage: "po",
      title: "Powrót do pracy i ochrona przed zwolnieniem",
      kind: "informacja",
      institution: "Pracodawca",
      forWhom: "Dla Ciebie",
      why: "W czasie urlopów i po powrocie obowiązuje ochrona przed zwolnieniem.",
      source: SRC.pip,
      action: { label: "Zobacz szczegóły" },
    },
  ];
}

const forChild = (text: string) => text.replace(/Oli\b/g, "dziecka").replace(/Olę\b/g, "dziecko").replace(/Ola\b/g, "dziecko");

/**
 * Plan oczekiwanego dziecka (termin 14.05.2027): ten sam katalog przystanków co plan Oli,
 * tylko w innym stanie — wszystko od narodzin czeka na zdarzenie, w ciąży są sprawy bieżące.
 */
function expectedStops(): Stop[] {
  const birth = "Po narodzinach dziecka";
  const base = olaStops().map((stop): Stop => {
    const common = { ...stop, id: `e-${stop.id}`, title: forChild(stop.title), forWhom: forChild(stop.forWhom), why: forChild(stop.why), parallelWith: stop.parallelWith && `e-${stop.parallelWith}` };
    if (stop.stage === "przed") return common; // przygotowania już za rodzicem
    if (stop.stage === "ciaza") {
      switch (stop.id) {
        case "badania-prenatalne":
          return { ...common, checked: false };
        case "chorobowy-ciaza":
          return { ...common, state: "warunek", condition: "Jeśli lekarz wystawi zwolnienie w ciąży", doc: undefined };
        case "macierzynski-przed":
          return { ...common, state: "warunek", condition: "Najwcześniej 6 tygodni przed terminem · od 2 kwietnia 2027" };
        case "zaplanuj-urlopy":
          return { ...common, kind: "na-wniosek", checked: undefined, state: "aktualna", due: "2027-06-04", dueBasis: "21 dni od planowanej daty porodu" };
      }
      return common;
    }
    // Narodziny i po narodzinach: nic jeszcze nie zaszło.
    const isInfo = stop.kind === "informacja" || stop.kind === "program-zdrowotny";
    return {
      ...common,
      checked: isInfo ? false : undefined,
      state: isInfo || stop.kind === "dzieje-sie-samo" ? undefined : "warunek",
      condition: stop.condition ?? (isInfo ? undefined : birth),
      due: undefined,
      dueBasis: stop.dueBasis,
      howTo: stop.howTo && { ...stop.howTo, doKiedy: stop.dueBasis ?? stop.howTo.doKiedy.replace(/^[^·]*· /, "") },
      action: { label: isInfo ? stop.action.label : "Zobacz, co przygotować", href: stop.action.href?.startsWith("#") ? stop.action.href : undefined },
      doc: stop.doc && { goal: stop.doc.goal, recipient: stop.doc.recipient, note: stop.condition ?? birth, optional: stop.doc.optional },
    };
  });
  const protection: Stop = {
    id: "e-praca",
    stage: "ciaza",
    substage: "I trymestr",
    title: "Ochrona pracownicy w ciąży",
    kind: "informacja",
    institution: "Pracodawca",
    forWhom: "Dla Ciebie",
    why: "Umowa terminowa po 3. miesiącu ciąży przedłuża się do dnia porodu.",
    source: SRC.pip,
    action: { label: "Zobacz szczegóły" },
    risk: {
      title: "Umowa kończy się przed terminem porodu",
      detail: "Twoja umowa kończy się 31 marca 2027. Jeśli przedłuży się do porodu, zachowasz prawo do zasiłku.",
      action: "Sprawdź, co zrobić",
    },
  };
  const at = base.findIndex((s) => s.id === "e-badania-prenatalne") + 1;
  return [...base.slice(0, at), protection, ...base.slice(at)];
}

function testStops(): Stop[] {
  return olaStops().map((stop) => {
    if (stop.id !== "800plus") return stop;
    return {
      ...stop,
      state: "wezwanie",
      action: { label: "Otwórz wezwanie", href: "/dokumenty/800plus" },
      doc: {
        ...stop.doc!,
        lastEvent: "Nowe pismo z ZUS · 19 listopada 2026",
        summons: {
          from: "ZUS",
          due: "2026-12-05",
          text: "Prosimy o dołączenie zaświadczenia ze szpitala potwierdzającego datę urodzenia dziecka.",
          tasks: ["Dołącz zaświadczenie ze szpitala wskazane w piśmie", "Sprawdź adresata i załączniki", "Wyślij uzupełnienie w symulacji"],
        },
        events: [
          ...(stop.doc!.events ?? []),
          { date: "2026-11-19", title: "Otrzymano wezwanie", detail: "Wezwanie do uzupełnienia dokumentów, termin 5 grudnia 2026.", author: "ZUS" },
        ],
      },
    } satisfies Stop;
  });
}

const OLA_CALC: CalculatorPlan = {
  scope: "Ola · urlop rodzicielski · planowane okresy",
  assumptions: "1 dziecko · bez „Za życiem” · bez hospitalizacji",
  parents: [
    { id: "ty", label: "Ty", dailyRate: 140 },
    { id: "partner", label: "Drugi rodzic", dailyRate: 105 },
  ],
  poolWeeks: 41,
  reservedWeeksEach: 9,
  usedWeeks: 0,
  variants: [
    {
      id: "A",
      label: "Kolejno, bez przerwy",
      segments: [
        { id: "a1", parentId: "ty", kind: "rodzicielski", start: "2027-03-30", days: 28 },
        { id: "a2", parentId: "partner", kind: "rodzicielski", start: "2027-04-27", days: 28 },
        { id: "a3", parentId: "partner", kind: "ojcowski", start: "2026-12-07", days: 14, draft: true, note: "Szkic · brakuje daty rozpoczęcia" },
      ],
    },
    {
      id: "B",
      label: "Jednocześnie od tego samego dnia",
      segments: [
        { id: "b1", parentId: "ty", kind: "rodzicielski", start: "2027-03-30", days: 28 },
        { id: "b2", parentId: "partner", kind: "rodzicielski", start: "2027-03-30", days: 28 },
        { id: "b3", parentId: "partner", kind: "ojcowski", start: "2026-12-07", days: 14, draft: true, note: "Szkic · brakuje daty rozpoczęcia" },
      ],
    },
  ],
};

const EXPECTED_CALC: CalculatorPlan = {
  scope: "Oczekiwane dziecko · urlop rodzicielski · planowane okresy",
  assumptions: "1 dziecko · bez „Za życiem” · bez hospitalizacji",
  planned: true,
  parents: [
    { id: "ty", label: "Ty", dailyRate: 140 },
    { id: "partner", label: "Drugi rodzic" },
  ],
  poolWeeks: 41,
  reservedWeeksEach: 9,
  usedWeeks: 0,
  variants: [
    {
      id: "A",
      label: "Kolejno, bez przerwy",
      segments: [
        { id: "a1", parentId: "ty", kind: "rodzicielski", start: "2027-10-01", days: 28 },
        { id: "a2", parentId: "partner", kind: "rodzicielski", start: "2027-10-29", days: 28 },
      ],
    },
  ],
};

const birthStages = (): Plan["stages"] => ({ ...STAGES });

export const PLANS: Plan[] = [
  {
    id: "ola",
    name: "Ola",
    kind: "rejestr",
    shortInfo: "11 dni",
    keyDateLabel: "Urodzona 10 listopada",
    stage: "narodziny",
    stages: birthStages(),
    stops: olaStops(),
    calculator: OLA_CALC,
  },
  {
    id: "oczekiwane",
    name: "Oczekiwane dziecko",
    kind: "planowane",
    shortInfo: "maj 2027",
    keyDateLabel: "Termin 14 maja 2027",
    stage: "ciaza",
    stages: birthStages(),
    stops: expectedStops(),
    calculator: EXPECTED_CALC,
  },
  {
    id: "test-alicja",
    name: "Sprawa testowa · Alicja T.",
    kind: "test",
    shortInfo: "Alicja T.",
    keyDateLabel: "Urodzone 10 listopada",
    stage: "narodziny",
    stages: birthStages(),
    stops: testStops(),
    calculator: OLA_CALC,
  },
  {
    id: "przyklad",
    name: "Przykład · rodzina Kowalskich",
    kind: "przyklad",
    shortInfo: "rodzina Kowalskich",
    keyDateLabel: "Plan przykładowy",
    stage: "narodziny",
    stages: birthStages(),
    stops: olaStops().map((s) => ({ ...s, title: s.title.replace("Oli", "dziecka").replace("Olę", "dziecko"), forWhom: s.forWhom.replace("Oli", "dziecka") })),
    calculator: { ...OLA_CALC, scope: "Przykład · urlop rodzicielski · planowane okresy" },
  },
];

export const DEFAULT_PLAN_ID = "ola";

export function getPlan(id: string): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export const STAGE_IDS: StageId[] = ["przed", "ciaza", "narodziny", "po"];

/** Fikcyjny rodzic z symulacji logowania. */
export const PARENT_PROFILE: ProfileRow[] = [
  { label: "Imię i nazwisko", value: "Anna Nowak", source: "demo", editable: false },
  { label: "Tytuł ubezpieczenia", value: "Umowa o pracę", source: "zus", editable: false },
  { label: "Ubezpieczenie chorobowe", value: "Obowiązkowe, od 1 marca 2021", source: "zus", editable: false },
  { label: "Pracodawca", value: "Kwiatek sp. z o.o. · do 20 ubezpieczonych", source: "zus", editable: false },
  { label: "Rola w planie", value: "Urodziłam dziecko", source: "rodzic", editable: true, options: ["Urodziłam dziecko", "Jestem drugim rodzicem"] },
  { label: "Zmiana pracy przed porodem", value: "Nie", source: "rodzic", editable: true, options: ["Tak", "Nie", "Nie wiem"] },
];

export const SOURCE_LABEL: Record<ProfileRow["source"], string> = {
  zus: "ZUS · symulacja",
  rejestr: "Rejestr",
  rodzic: "Podane przez Ciebie",
  demo: "Profil demonstracyjny",
  zalozenie: "Moje założenie",
};
