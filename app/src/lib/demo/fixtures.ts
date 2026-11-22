/**
 * Dane fikcyjne do makiet i demo (wspólny przykład z ui/MACIEJ.md): dzień demo 21.11.2026,
 * Ola urodzona 10.11.2026, etap „Narodziny”. Wyłącznie dane fikcyjne.
 * TODO(backend): zastąpić danymi z API, zachowując typy z `types.ts`.
 */
import { OLA } from "../family/ola";
import { formatLong } from "./dates";
import { S } from "./stop-details";
import type { CalculatorPlan, Plan, ProfileRow, StageId, Stop } from "./types";

const STAGES: Plan["stages"] = {
  przed: { label: "Planowanie" },
  ciaza: { label: "Ciąża" },
  narodziny: { label: "Narodziny" },
  po: { label: "Po narodzinach" },
};

const SRC = {
  usc: { label: "gov.pl · Zgłoś urodzenie dziecka", url: "https://www.gov.pl/web/gov/zglos-urodzenie-dziecka" },
  zusDocs: { label: "zus.pl · Zasiłek macierzyński — niezbędne dokumenty", url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/niezbedne-dokumenty" },
  zusAmount: { label: "zus.pl · Wysokość zasiłku macierzyńskiego", url: "https://www.zus.pl/pl/swiadczenia/zasilki/zasilek-macierzynski/wysokosc" },
  nfzInsurance: { label: "pacjent.gov.pl · Jak ubezpieczyć członka rodziny", url: "https://pacjent.gov.pl/artykul/jak-ubezpieczyc-czlonka-rodziny" },
  plus800: { label: "zus.pl · Świadczenie wychowawcze 800+", url: "https://www.zus.pl/swiadczenia/swiadczenia-dla-rodzin/swiadczenie-wychowawcze-800-plus" },
  becikowe: { label: "gov.pl · Uzyskaj becikowe", url: "https://www.gov.pl/web/gov/uzyskaj-becikowe" },
  poz: { label: "pacjent.gov.pl · Wybierz dziecku lekarza rodzinnego", url: "https://pacjent.gov.pl/aktualnosc/wybierz-dziecku-lekarza-rodzinnego" },
  prenatal: { label: "pacjent.gov.pl · Program badań prenatalnych", url: "https://pacjent.gov.pl/program-profilaktyczny/program-badan-prenatalnych" },
  screening: { label: "przesiew.imid.med.pl · Badania przesiewowe noworodków", url: "https://przesiew.imid.med.pl/" },
  vaccines: { label: "pacjent.gov.pl · Kalendarz szczepień 2026", url: "https://pacjent.gov.pl/kalendarz-szczepien-dzieci-i-mlodziezy-na-2026-rok" },
  parental: { label: "gov.pl · Urlop rodzicielski", url: "https://www.gov.pl/web/rodzina/urlop-rodzicielski" },
  aktywny: { label: "gov.pl · Program Aktywny Rodzic", url: "https://www.gov.pl/web/rodzina/pytania-i-odpowiedzi---program-aktywny-rodzic" },
  pip: { label: "pip.gov.pl · Uprawnienia rodzicielskie", url: "https://www.pip.gov.pl/dla-pracodawcow/porady-prawne/rodzicielstwo" },
  poradnikPozor: S.poradnikPozor,
  poradnikSick: S.poradnikSick,
  uzArt30: S.uzArt30,
};

function olaStops(): Stop[] {
  return [
    // Planowanie (przed ciążą)
    {
      id: "ubezpieczenie",
      stage: "przed",
      title: "Sprawdź swoje ubezpieczenie chorobowe",
      kind: "informacja",
      checked: true,
      institution: "ZUS",
      forWhom: "Dla Ciebie",
      why: "Zasiłek macierzyński przysługuje, jeśli w dniu porodu masz ubezpieczenie chorobowe, bez względu na to, jak długo ono trwa.",
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
      why: "W kalkulatorze wpisz podstawę z dokumentów o Twoim wynagrodzeniu.",
      source: SRC.zusAmount,
      action: { label: "Jak ZUS liczy zasiłek" },
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
      // Zadanie ZUS s. 9–10 (pkt H) i s. 13 (pkt h). Opis i źródła: stop-details.ts.
      id: "ryzyka",
      stage: "ciaza",
      substage: "I trymestr",
      title: "Co może odebrać albo obniżyć zasiłek",
      kind: "informacja",
      checked: true,
      institution: "ZUS",
      forWhom: "Dla Ciebie",
      why: "Umowa dla pozoru, podwyżka wynagrodzenia w ciąży i brak ubezpieczenia chorobowego w dniu porodu to sytuacje, w których ZUS może odmówić zasiłku albo ustalić go niżej.",
      source: SRC.poradnikPozor,
      action: { label: "Zobacz szczegóły" },
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
      why: "Za niezdolność do pracy w ciąży zasiłek chorobowy wynosi 100% podstawy, najdłużej przez 270 dni.",
      source: SRC.zusDocs,
      action: { label: "Zobacz szczegóły" },
      doc: { goal: "swiadczenia", recipient: "ZUS", result: "Świadczenie wypłacone", lastEvent: "Wypłacono 30 września 2026" },
    },
    {
      // Zadanie ZUS s. 4 i s. 12 (pkt a). Opis i źródła: stop-details.ts.
      id: "zasilek-likwidacja",
      stage: "ciaza",
      substage: "II trymestr",
      title: "Gdy pracodawca upadnie albo zostanie zlikwidowany",
      kind: "informacja",
      checked: true,
      institution: "ZUS",
      forWhom: "Dla Ciebie",
      why: "Jeśli w ciąży stracisz pracę przez upadłość, likwidację albo śmierć pracodawcy, do porodu dostajesz zasiłek w wysokości zasiłku macierzyńskiego, a po porodzie zasiłek macierzyński.",
      source: SRC.uzArt30,
      action: { label: "Zobacz szczegóły" },
    },
    {
      // Zadanie ZUS s. 12 (pkt a). Opis i źródła: stop-details.ts.
      id: "swiadczenie-rehabilitacyjne",
      stage: "ciaza",
      substage: "III trymestr",
      title: "Długie zwolnienie: świadczenie rehabilitacyjne",
      kind: "informacja",
      checked: true,
      institution: "ZUS",
      forWhom: "Dla Ciebie",
      why: "Świadczenie przysługuje, gdy niezdolność do pracy trwa dłużej niż 270 dni zasiłku chorobowego, a leczenie rokuje powrót do pracy. W ciąży wynosi 100% podstawy.",
      source: SRC.poradnikSick,
      action: { label: "Zobacz szczegóły" },
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
      howTo: {
        co: "Wniosek o część urlopu macierzyńskiego przed porodem",
        doKogo: "Pracodawca, papierowo lub elektronicznie",
        doKiedy: "Przed rozpoczęciem urlopu",
        zalaczniki: "Kopia zaświadczenia lekarskiego o przewidywanej dacie porodu, jeżeli nie ma jej w aktach osobowych",
      },
      source: S.govMaternity,
      action: { label: "Zobacz szczegóły" },
      doc: { goal: "urlopy", recipient: "Do pracodawcy", optional: true },
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
      why: "Wniosek o wypłatę 81,5% za cały okres składasz do 21 dni po porodzie.",
      source: SRC.zusAmount,
      action: { label: "Policz podział urlopu", href: "#kalkulator" },
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
      title: "Zaświadczenie Z-3 od pracodawcy",
      kind: "dzieje-sie-samo",
      institution: "Pracodawca",
      forWhom: "Dla Ciebie",
      why: "Pracodawca, który ma do 20 ubezpieczonych, przekazuje do ZUS zaświadczenie o wynagrodzeniu razem z Twoim wnioskiem.",
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
      why: "USC sporządzi akt urodzenia Oli i wyda pierwszy odpis skrócony bez opłaty.",
      prepare: ["Imię lub dwa imiona dziecka i dane rodziców", "W USC dowód osobisty lub paszport", "Przy zgłoszeniu online skrzynka do e-Doręczeń"],
      howTo: {
        co: "Zgłoszenie urodzenia dziecka",
        doKogo: "USC miejsca urodzenia dziecka, osobiście lub przez gov.pl albo aplikację mObywatel",
        doKiedy: "1 grudnia 2026 · 21 dni od wystawienia karty urodzenia",
        zalaczniki: "Brak. Kartę urodzenia przekazuje szpital.",
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
      dueBasis: "21 dni po porodzie na wybór stawki 81,5%",
      institution: "Pracodawca lub ZUS",
      forWhom: "Dla Ciebie",
      why: "Jeśli wybierasz stawkę 81,5%, złóż wniosek w ciągu 21 dni po porodzie. Za 9 tygodni zarezerwowanych dla drugiego rodzica przysługuje 70%.",
      prepare: ["Dane Oli i drugiego rodzica", "Adres, dane pracodawcy z NIP oraz okres urlopu", "Odpis skrócony aktu urodzenia, jeśli zasiłek wypłaca pracodawca"],
      howTo: {
        co: "ZAM z deklaracją wykorzystania pełnego wymiaru urlopów",
        doKogo: "Do kadr lub bezpośrednio do ZUS, jeżeli ZUS wypłaca zasiłek",
        doKiedy: "1 grudnia 2026 · 21 dni od porodu",
        zalaczniki: "Gdy płaci pracodawca, odpis skrócony aktu urodzenia. Gdy płaci ZUS, dane do pobrania aktu z rejestru i Z-3 od pracodawcy.",
      },
      source: SRC.zusDocs,
      action: { label: "Dokończ z Zusikiem", href: "/dokumenty/zasilek-macierzynski" },
      doc: { goal: "swiadczenia", recipient: "Do płatnika zasiłku", note: "Uzupełnij dane Oli i wybierz płatnika zasiłku", hasDraft: true },
    },
    {
      id: "urlop-macierzynski",
      stage: "narodziny",
      title: "Urlop macierzyński po porodzie",
      kind: "informacja",
      institution: "Pracodawca",
      forWhom: "Dla Ciebie",
      why: "Gdy nie korzystałaś z urlopu przed porodem, urlop zaczyna się w dniu porodu. Nie składasz wniosku o jego udzielenie.",
      source: S.govMaternity,
      action: { label: "Sprawdź zasady urlopu" },
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
      why: "W ciągu 7 dni od nadania numeru PESEL przekaż kadrom dane Oli. Pracodawca zgłosi ją do ZUS na druku ZCNA. Wystarczy zgłoszenie przez jednego rodzica.",
      howTo: {
        co: "Pismo o zgłoszenie dziecka do ubezpieczenia zdrowotnego",
        doKogo: "Do pracodawcy lub działu kadr",
        doKiedy: "7 dni od nadania numeru PESEL",
        zalaczniki: "W piśmie podaj PESEL dziecka i datę uzyskania uprawnień. Wymień dokumenty, które dołączasz na prośbę kadr.",
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
      why: "Pierwszy odpis skrócony dostaniesz po rejestracji. Dodatkowy możesz zamówić w dowolnym USC, listownie albo przez gov.pl.",
      prepare: ["Data i miejsce urodzenia Oli", "Cel wydania odpisu", "Potwierdzenie opłaty, jeśli jest należna"],
      source: { label: "gov.pl · Uzyskaj odpis aktu stanu cywilnego", url: "https://www.gov.pl/web/gov/uzyskaj-odpis-aktu-stanu-cywilnego-urodzenia-malzenstwa-zgonu" },
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
        doKiedy: "Co najmniej 7 dni przed rozpoczęciem. Cały urlop po urodzeniu dziecka wykorzystaj przed jego pierwszymi urodzinami.",
        zalaczniki: "Odpis skrócony aktu urodzenia lub jego kopia i oświadczenie o wykorzystanym urlopie. Dokumentu z akt osobowych nie dołączasz ponownie.",
      },
      source: S.govPaternity,
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
      howTo: { co: "Wniosek SW-R o świadczenie wychowawcze", doKogo: "ZUS przez eZUS, mZUS, bank lub Emp@tię", doKiedy: "10 lutego 2027 · 3 miesiące od urodzenia na wyrównanie", zalaczniki: "Przy opiece naprzemiennej dołącz orzeczenie sądu. Przy pobycie cudzoziemca mogą być potrzebne dokumenty pobytowe." },
      source: SRC.plus800,
      action: { label: "Zobacz przebieg sprawy", href: "/dokumenty/800plus" },
      doc: {
        goal: "swiadczenia",
        recipient: "Do ZUS",
        lastEvent: "Wpis planu o przekazaniu z 15 listopada 2026",
        events: [
          { date: "2026-11-15", title: "Wcześniejszy wpis o przekazaniu", detail: "Wpis planu dotyczący wniosku SW-R." },
          { date: "2026-11-15", title: "Wcześniejszy wpis planu o wpływie" },
        ],
      },
    },
    {
      id: "poz",
      stage: "po",
      title: "Wybierz przychodnię dla Oli",
      kind: "na-wniosek",
      state: "warunek",
      condition: "Po narodzinach, gdy wybierasz opiekę POZ",
      institution: "Przychodnia lub IKP",
      forWhom: "Dla Oli",
      why: "Możesz wybrać lekarza, pielęgniarkę i położną POZ dla Oli. Dla każdej osoby składasz osobną deklarację.",
      source: SRC.poz,
      action: { label: "Zobacz, co przygotować" },
      doc: { goal: "zdrowie", recipient: "Przychodnia", note: "Na koncie dziecka w IKP lub u świadczeniodawcy" },
    },
    {
      id: "rodzicielski",
      stage: "po",
      title: "Urlop rodzicielski",
      kind: "na-wniosek",
      state: "aktualna",
      dueBasis: "Wniosek co najmniej 21 dni przed rozpoczęciem",
      institution: "Pracodawca",
      forWhom: "Dla Was obojga",
      why: "Zaplanuj okres urlopu i sprawdź, ile urlopu każde z Was już wykorzystało. Każde z Was ma 9 tygodni tylko dla siebie.",
      howTo: {
        co: "Wniosek o udzielenie urlopu rodzicielskiego",
        doKogo: "Pracodawca, papierowo lub elektronicznie",
        doKiedy: "Co najmniej 21 dni przed rozpoczęciem wybranej części",
        zalaczniki: "Dokument urodzenia, oświadczenie o planach drugiego rodzica i kopia zaświadczenia „Za życiem”, jeśli korzystasz z dłuższego wymiaru.",
      },
      source: SRC.parental,
      action: { label: "Policz podział urlopu", href: "#kalkulator" },
      doc: { goal: "urlopy", recipient: "Do pracodawcy" },
    },
    {
      id: "rodzicielski-praca",
      stage: "po",
      title: "Łączenie urlopu rodzicielskiego z pracą",
      kind: "na-wniosek",
      state: "aktualna",
      institution: "Pracodawca",
      forWhom: "Dla rodzica korzystającego z urlopu",
      why: "Możesz pracować do połowy pełnego etatu u pracodawcy udzielającego urlopu. W osobnym piśmie wskaż okres i wymiar pracy.",
      dueBasis: "Co najmniej 21 dni przed rozpoczęciem pracy",
      source: S.govParental,
      action: { label: "Rozpocznij wniosek" },
      doc: { goal: "urlopy", recipient: "Do pracodawcy", optional: true },
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
      state: "aktualna",
      dueBasis: "Do 12 miesięcy od urodzenia",
      institution: "Urząd gminy",
      forWhom: "Dla Oli",
      why: "1000 zł przy dochodzie do 1922 zł netto na osobę i opiece medycznej od 10. tygodnia ciąży.",
      howTo: {
        co: "Wniosek o becikowe (SR-2)",
        doKogo: "Gmina lub OPS właściwe dla miejsca zamieszkania, osobiście, pocztą lub przez Emp@tię",
        doKiedy: "10 listopada 2027 · 12 miesięcy od urodzenia",
        zalaczniki: "Zaświadczenie lekarza lub położnej. Zależnie od sytuacji również oświadczenia dochodowe, dokumenty dotyczące alimentów, opieki lub pobytu.",
      },
      source: SRC.becikowe,
      action: { label: "Przygotuj wniosek", href: "/dokumenty/becikowe" },
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
        case "ryzyka":
        case "zasilek-likwidacja":
        case "swiadczenie-rehabilitacyjne":
          return { ...common, checked: false };
        case "chorobowy-ciaza":
          return { ...common, state: "warunek", condition: "Jeśli lekarz wystawi zwolnienie w ciąży", doc: undefined };
        case "macierzynski-przed":
          return { ...common, state: "aktualna", dueBasis: "Pierwszy możliwy dzień urlopu: 2 kwietnia 2027" };
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
      detail: "Twoja umowa kończy się 31 marca 2027. Umowa na czas określony, która skończyłaby się po 3. miesiącu ciąży, przedłuża się do dnia porodu (nie dotyczy umowy na zastępstwo).",
      action: "Sprawdź, co mówią przepisy",
      // Umowa na czas określony, która skończyłaby się po 3. miesiącu ciąży, przedłuża się do dnia porodu.
      sources: [{ label: "zielonalinia.gov.pl · Uprawnienia związane z rodzicielstwem", url: "https://zielonalinia.gov.pl/uprawnienia-zwiazane-z-rodzicielstwem/" }],
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
          tasks: ["Dołącz zaświadczenie ze szpitala wskazane w piśmie", "Sprawdź adresata i załączniki", "Przekaż uzupełnienie odbiorcy"],
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
    shortInfo: "Ola Lis",
    keyDateLabel: `ur. ${formatLong(OLA.birthDate)}`,
    keyDate: OLA.birthDate,
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
    keyDate: "2027-05-14",
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
    keyDate: "2026-11-10",
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

export const PARENT_PROFILE: ProfileRow[] = [
  { label: "Imię i nazwisko", value: OLA.mother, source: "rodzic", editable: false },
  { label: "Drugi rodzic", value: OLA.father, source: "rodzic", editable: false },
  { label: "Tytuł ubezpieczenia", value: "Umowa o pracę", source: "rodzic", editable: false },
  { label: "Pracodawca", value: OLA.employer, source: "rodzic", editable: false },
];

export const SOURCE_LABEL: Record<ProfileRow["source"], string> = {
  zus: "Dokumenty rodziny",
  rejestr: "Profil rodziny",
  rodzic: "Podane przez rodzinę",
  demo: "Profil rodziny",
  zalozenie: "Moje założenie",
  login: "Profil rodziny",
};

/**
 * Katalog przystanków do budowania planu z onboardingu (`lib/plan/build.ts`). Daty w katalogu
 * są liczone od dat kluczowych przykładu: urodzenie Oli i termin oczekiwanego dziecka.
 */
export const CATALOG = {
  born: olaStops,
  expected: expectedStops,
  bornKeyDate: "2026-11-10",
  expectedKeyDate: "2027-05-14",
  bornCalculator: OLA_CALC,
  expectedCalculator: EXPECTED_CALC,
  stages: (): Plan["stages"] => ({ ...STAGES }),
};
