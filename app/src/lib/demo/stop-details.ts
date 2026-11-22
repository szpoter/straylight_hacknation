/** Opisy przystanków na podstawie oficjalnych źródeł (sprawdzone 21.11.2026). */
export type StopDetails = { paragraphs: string[]; sources: Array<{ label: string; url: string }>; checked: string; uwagi?: string };

export const CHECKED = "2026-11-21";
/** Sprawdzenie nowych opisów (zadanie ZUS s. 12–13, pkt a i h) z tekstem przepisów w korpusie. */
const CHECKED_LAW = "2026-11-22";

// Te same pliki co w korpusie Zusika (manifest: Dz.U. 2026 poz. 854 i 1316, Poradnik ZUS 2026).
const UZ_PDF = "https://eli.gov.pl/api/acts/DU/2026/854/text.pdf";
const RZ_PDF = "https://eli.gov.pl/api/acts/DU/2026/1316/text.pdf";
const PORADNIK_PDF =
  "https://www.zus.pl/documents/10182/167567/1184_26%2BPoradnik%2Bdla%2Brodzic%C3%B3w.pdf/9378de60-151e-9b9f-ba65-abdf41d9f5b4?download=true&version=1.0";

export const S = {
  leaveRequests: { label: "Dz.U. 2025 poz. 322 · Wnioski pracowników dotyczące rodzicielstwa", url: "https://eli.gov.pl/eli/DU/2025/322/ogl" },
  govParentBenefit: { label: "gov.pl · Uzyskaj świadczenie rodzicielskie", url: "https://www.gov.pl/web/gov/uzyskaj-swiadczenie-rodzicielskie" },
  zielonaLinia: { label: "zielonalinia.gov.pl · Uprawnienia związane z rodzicielstwem", url: "https://zielonalinia.gov.pl/uprawnienia-zwiazane-z-rodzicielstwem/" },
  usc: { label: "gov.pl · Zgłoś urodzenie dziecka", url: "https://www.gov.pl/web/gov/zglos-urodzenie-dziecka" },
  odpisInfo: { label: "gov.pl · Uzyskaj odpis aktu stanu cywilnego", url: "https://www.gov.pl/web/gov/uzyskaj-odpis-aktu-stanu-cywilnego-urodzenia-malzenstwa-zgonu" },
  uscApp: { label: "gov.pl · Zgłoś urodzenie w mObywatelu", url: "https://www.gov.pl/web/cyfryzacja/zglos-urodzenie-dziecka-w-mobywatelu-bez-umawiania-wizyty-w-urzedzie-bez-kolejek" },
  pozDruki: { label: "Minister Zdrowia · Wzory deklaracji wyboru POZ", url: "https://eli.gov.pl/eli/DU/2020/1143/ogl" },
  pozUstawa: { label: "Ustawa o podstawowej opiece zdrowotnej, art. 9–10", url: "https://eli.gov.pl/api/acts/DU/2025/515/text.pdf" },
  zusKomu: { label: "zus.pl · Zasiłek macierzyński — komu przysługuje", url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/komu-przysluguje" },
  zusDocs: { label: "zus.pl · Zasiłek macierzyński — niezbędne dokumenty", url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/niezbedne-dokumenty" },
  zusAmount: { label: "zus.pl · Wysokość zasiłku macierzyńskiego", url: "https://www.zus.pl/pl/swiadczenia/zasilki/zasilek-macierzynski/wysokosc" },
  zusBase: { label: "zus.pl · Podstawa wymiaru zasiłku — dla pracowników", url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/podstawa-wymiaru/dla-pracownikow" },
  zusPayers: { label: "zus.pl · Płatnicy zasiłku", url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/postepowanie-w-sprawie-zasilkow/platnicy-zasilku" },
  zusMaternity: {
    label: "zus.pl · Zasiłek za okres urlopu macierzyńskiego",
    url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/prawo-do-zasilku-i-okres-przyslugiwania/za-okres-urlopu-macierzynskiego-albo-urlopu-na-warunkach-urlopu-macierzynskiego",
  },
  zusPaternity: {
    label: "zus.pl · Zasiłek za okres urlopu ojcowskiego",
    url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/prawo-do-zasilku-i-okres-przyslugiwania/za-okres-dodatkowego-urlopu-ojcowskiego",
  },
  zusParental: {
    label: "zus.pl · Zasiłek za okres urlopu rodzicielskiego",
    url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/prawo-do-zasilku-i-okres-przyslugiwania/za-okres-dodatkowego-urlopu-rodzicielskiego",
  },
  zusSickRight: {
    label: "zus.pl · Zasiłek chorobowy — prawo do zasiłku i okres przysługiwania",
    url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-chorobowy/z-ubezpieczenia-chorobowego/prawo-do-zasilku-i-okres-przyslugiwania",
  },
  zusSickAmount: { label: "zus.pl · Zasiłek chorobowy — wysokość", url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-chorobowy/z-ubezpieczenia-chorobowego/wysokosc" },
  zus800: { label: "zus.pl · Świadczenie wychowawcze 800 plus", url: "https://www.zus.pl/swiadczenia/swiadczenia-dla-rodzin/swiadczenie-wychowawcze-800-plus" },
  zus800Term: { label: "Ustawa o pomocy państwa w wychowywaniu dzieci, art. 18", url: "https://api.sejm.gov.pl/eli/acts/DU/2026/508/text.pdf" },
  nfzInsurance: { label: "pacjent.gov.pl · Jak ubezpieczyć członka rodziny", url: "https://pacjent.gov.pl/artykul/jak-ubezpieczyc-czlonka-rodziny" },
  poz: { label: "pacjent.gov.pl · Wybierz dziecku lekarza rodzinnego", url: "https://pacjent.gov.pl/aktualnosc/wybierz-dziecku-lekarza-rodzinnego" },
  prenatal: { label: "pacjent.gov.pl · Program badań prenatalnych", url: "https://pacjent.gov.pl/program-profilaktyczny/program-badan-prenatalnych" },
  screening: { label: "przesiew.imid.med.pl · Badania przesiewowe noworodków", url: "https://przesiew.imid.med.pl/" },
  vaccines: { label: "pacjent.gov.pl · Kalendarz szczepień 2026", url: "https://pacjent.gov.pl/kalendarz-szczepien-dzieci-i-mlodziezy-na-2026-rok" },
  becikowe: { label: "gov.pl · Uzyskaj becikowe", url: "https://www.gov.pl/web/gov/uzyskaj-becikowe" },
  aktywny: { label: "gov.pl · Program Aktywny Rodzic — pytania i odpowiedzi", url: "https://www.gov.pl/web/rodzina/pytania-i-odpowiedzi---program-aktywny-rodzic" },
  govMaternity: { label: "gov.pl · Urlop macierzyński", url: "https://www.gov.pl/web/rodzina/urlop-macierzynski" },
  govPaternity: { label: "gov.pl · Urlop ojcowski", url: "https://www.gov.pl/web/rodzina/urlop-ojcowski" },
  govParental: { label: "gov.pl · Urlop rodzicielski", url: "https://www.gov.pl/web/rodzina/urlop-rodzicielski" },
  govRights: { label: "gov.pl · Uprawnienia związane z rodzicielstwem", url: "https://www.gov.pl/web/rodzina/uprawnienia-zwiazane-z-rodzicielstwem" },
  bizProtected: { label: "biznes.gov.pl · Pracownicy chronieni przed zwolnieniem", url: "https://www.biznes.gov.pl/pl/portal/00202" },
  // Akty prawne i Poradnik ZUS z korpusu Zusika (app/corpus/publiczne/manifest.json); strona PDF w kotwicy.
  uzArt2a: { label: "Ustawa zasiłkowa, art. 2a (zaległości w składkach)", url: `${UZ_PDF}#page=3` },
  uzArt18: { label: "Ustawa zasiłkowa, art. 18 (świadczenie rehabilitacyjne: komu i jak długo)", url: `${UZ_PDF}#page=7` },
  uzArt19: { label: "Ustawa zasiłkowa, art. 19 (wysokość świadczenia rehabilitacyjnego)", url: `${UZ_PDF}#page=8` },
  uzArt29: { label: "Ustawa zasiłkowa, art. 29 (komu przysługuje zasiłek macierzyński)", url: `${UZ_PDF}#page=9` },
  uzArt30: { label: "Ustawa zasiłkowa, art. 30–31 (zasiłek po ustaniu ubezpieczenia, wysokość zasiłku)", url: `${UZ_PDF}#page=11` },
  uzArt61: { label: "Ustawa zasiłkowa, art. 61 (kto wypłaca zasiłki)", url: `${UZ_PDF}#page=26` },
  rzPar17: { label: "Rozporządzenie o dokumentach zasiłkowych, § 15 i § 17", url: `${RZ_PDF}#page=4` },
  rzZal5: { label: "Rozporządzenie o dokumentach zasiłkowych, załącznik nr 5 (wniosek o świadczenie rehabilitacyjne)", url: `${RZ_PDF}#page=16` },
  poradnikPozor: { label: "ZUS · Poradnik dla rodziców 2026, s. 9 (umowa dla pozoru, wysokość wynagrodzenia)", url: `${PORADNIK_PDF}#page=9` },
  poradnikZlecenie: { label: "ZUS · Poradnik dla rodziców 2026, s. 10 i 12 (zleceniobiorcy)", url: `${PORADNIK_PDF}#page=10` },
  poradnikFirma: { label: "ZUS · Poradnik dla rodziców 2026, s. 14 (działalność: dobrowolne ubezpieczenie chorobowe)", url: `${PORADNIK_PDF}#page=14` },
  poradnikSick: { label: "ZUS · Poradnik dla rodziców 2026, s. 25 (okres zasiłkowy, świadczenie rehabilitacyjne)", url: `${PORADNIK_PDF}#page=25` },
} as const;

export const STOP_DETAILS: Record<string, StopDetails> = {
  ubezpieczenie: {
    paragraphs: [
      "Zasiłek macierzyński dostaje osoba objęta ubezpieczeniem chorobowym, obowiązkowo albo dobrowolnie: pracownik, zleceniobiorca, osoba prowadząca działalność i kilka innych grup.",
      "Do zasiłku macierzyńskiego nie trzeba mieć żadnego minimalnego stażu w ubezpieczeniu. ZUS podaje przykład: zasiłek przysługuje nawet wtedy, gdy dziecko urodzi się dzień po zgłoszeniu do ubezpieczenia chorobowego.",
      "Okres wyczekiwania dotyczy zasiłku chorobowego, np. w czasie ciąży. Przy ubezpieczeniu obowiązkowym prawo do niego masz po 30 dniach nieprzerwanego ubezpieczenia, a przy dobrowolnym po 90 dniach. Przerwa do 30 dni nie przerywa ciągłości.",
      "Jeśli prowadzisz działalność i sam płacisz składki, zasiłek dostaniesz tylko wtedy, gdy zaległość w składkach nie przekracza 1% minimalnego wynagrodzenia. Spłata całego długu w ciągu 6 miesięcy przywraca prawo do zasiłku za cały okres.",
    ],
    sources: [S.zusKomu, S.zusSickRight],
    checked: CHECKED,
    uwagi:
      "Źródło w fixtures (zus.pl · wysokość) nie mówi o ubezpieczeniu. Zmieniono je na „komu przysługuje” i stronę o zasiłku chorobowym. ZUS pisze wprost, że zasiłek macierzyński przysługuje niezależnie od stażu w ubezpieczeniu. Okres wyczekiwania 30 lub 90 dni dotyczy tylko zasiłku chorobowego, więc `why` nie powinno go łączyć z prawem do zasiłku macierzyńskiego.",
  },

  wysokosc: {
    paragraphs: [
      "Podstawą zasiłku pracownika jest przeciętne miesięczne wynagrodzenie z 12 miesięcy kalendarzowych przed miesiącem, w którym powstało prawo do zasiłku. Przy krótszym zatrudnieniu liczy się pełne przepracowane miesiące.",
      "Do podstawy wchodzi przychód, od którego płacisz składkę chorobową, po odliczeniu składek na ubezpieczenia społeczne potrąconych przez pracodawcę. Uwzględnia się wynagrodzenie od obecnego pracodawcy.",
      "Za urlop macierzyński i ojcowski zasiłek wynosi 100% podstawy, a za urlop rodzicielski 70%. Jeśli w ciągu 21 dni po porodzie złożysz wniosek o zasiłek za cały okres, dostaniesz 81,5% za urlop macierzyński i rodzicielski.",
      "Jeśli zasiłek po odjęciu zaliczki na podatek jest niższy niż 1000 zł miesięcznie, płatnik podnosi go do tej kwoty, czyli do wysokości świadczenia rodzicielskiego.",
      "Gdy zasiłek wypłaca ZUS, pracodawca wystawia zaświadczenie płatnika składek na druku Z-3 (pracownicy) albo Z-3a (część innych ubezpieczonych).",
    ],
    sources: [S.zusBase, S.zusAmount, S.zusDocs],
    checked: CHECKED,
    uwagi:
      "Strona ZUS nie podaje wskaźnika 13,71%, mówi tylko o odliczeniu składek na ubezpieczenia społeczne. Oprócz źródła z fixtures dodano stronę o podstawie wymiaru.",
  },

  "badania-prenatalne": {
    paragraphs: [
      "Program badań prenatalnych NFZ jest bezpłatny i obejmuje wszystkie kobiety w ciąży, bez względu na wiek.",
      "Badania nieinwazyjne to USG płodu między 11. a 14. tygodniem oraz między 18. tygodniem a 22. tygodniem i 6. dniem ciąży, a także badania biochemiczne z krwi.",
      "Potrzebne jest skierowanie od lekarza prowadzącego ciążę z podanym wiekiem ciąży w tygodniach. Termin ustala poradnia według tygodnia ciąży.",
      "Gdy wynik jest nieprawidłowy albo niejednoznaczny lub gdy spełnione są kryteria medyczne, lekarz kieruje na dalszą diagnostykę, np. poradę genetyczną lub amniopunkcję, w ośrodku specjalistycznym.",
      "Placówkę znajdziesz w wyszukiwarce NFZ po haśle „Badania prenatalne”. Zabierz skierowanie, wcześniejsze wyniki i dokument tożsamości.",
    ],
    sources: [S.prenatal],
    checked: CHECKED,
  },

  "chorobowy-ciaza": {
    paragraphs: [
      "Za niezdolność do pracy w czasie ciąży zasiłek chorobowy wynosi 100% podstawy wymiaru, także za pobyt w szpitalu.",
      "W ciąży zasiłek przysługuje przez cały czas niezdolności do pracy, najdłużej przez 270 dni. W innych przypadkach limit wynosi zwykle 182 dni.",
      "Pracownik za pierwsze 33 dni choroby w roku (14 dni po 50. roku życia) dostaje wynagrodzenie chorobowe od pracodawcy. Zasiłek z ZUS przysługuje od kolejnego dnia. Inni ubezpieczeni dostają zasiłek od pierwszego dnia.",
      "Prawo do zasiłku chorobowego masz po 30 dniach nieprzerwanego ubezpieczenia obowiązkowego albo po 90 dniach dobrowolnego.",
      "Jeśli wykorzystasz cały okres zasiłkowy, a leczenie rokuje powrót do pracy, możesz ubiegać się o świadczenie rehabilitacyjne. Opisujemy je w osobnej sprawie na ścieżce.",
    ],
    sources: [S.zusSickAmount, S.zusSickRight, S.poradnikSick],
    checked: CHECKED,
    uwagi:
      "Źródło w fixtures (zus.pl · zasiłek macierzyński — dokumenty) nie dotyczy zasiłku chorobowego. Zmieniono je na strony ZUS o wysokości i okresie zasiłku chorobowego. Te strony nie wspominają o kodzie „B” na zwolnieniu. biznes.gov.pl (Pracownicy chronieni przed zwolnieniem) wymienia kod „B” tylko jako potwierdzenie ciąży.",
  },

  ryzyka: {
    paragraphs: [
      "Umowa zawarta dla pozoru. Ubezpieczenie jest skuteczne tylko wtedy, gdy naprawdę pracujesz. ZUS może zbadać, w jakich okolicznościach zawarto umowę o pracę albo umowę zlecenia. Jeśli uzna, że zawarto ją dla pozoru albo w celu obejścia prawa, wydaje decyzję o niepodleganiu ubezpieczeniom społecznym. Bez ubezpieczenia chorobowego nie ma prawa do zasiłku chorobowego ani macierzyńskiego.",
      "Podwyżka wynagrodzenia w ciąży. ZUS może zbadać, czy wynagrodzenie w umowie o pracę ustalono w uzasadnionej wysokości, i wydać decyzję w sprawie podstawy wymiaru składek. Jeśli uzna, że podwyżka miała służyć tylko wyższemu zasiłkowi, ustali niższą podstawę, więc zasiłek też będzie niższy.",
      "Podstawą zasiłku pracownika jest średnie wynagrodzenie z 12 miesięcy kalendarzowych przed miesiącem, w którym powstało prawo do zasiłku. Jedna podwyżka tuż przed porodem zmienia więc tylko część tej średniej.",
      "Brak ubezpieczenia chorobowego w dniu porodu. Zasiłek macierzyński przysługuje, jeśli urodzisz dziecko (albo przyjmiesz je na wychowanie) w czasie ubezpieczenia chorobowego.",
      "Przy umowie zlecenia i przy własnej firmie ubezpieczenie chorobowe jest dobrowolne. Trzeba się do niego zgłosić (druk ZUS ZUA). Co do zasady obejmuje Cię najwcześniej od dnia złożenia zgłoszenia, nie wstecz. Przy firmie ustaje m.in. wtedy, gdy wygasa obowiązek ubezpieczeń emerytalnego i rentowych, np. po jej zamknięciu.",
      "Jeśli umowa o pracę skończy się przed porodem, zasiłek macierzyński przysługuje tylko w wyjątkach: śmierć, upadłość lub likwidacja pracodawcy, rozwiązanie umowy z naruszeniem prawa stwierdzone prawomocnym wyrokiem sądu albo umowa na czas określony przedłużona z mocy prawa do dnia porodu.",
      "Zaległości w składkach przy własnej firmie. Jeśli w dniu powstania prawa do zasiłku zaległość przekracza 1% minimalnego wynagrodzenia, zasiłek nie przysługuje do czasu spłaty całego długu. Bez spłaty w ciągu 6 miesięcy prawo się przedawnia.",
    ],
    sources: [S.poradnikPozor, S.zusBase, S.uzArt29, S.uzArt30, S.poradnikZlecenie, S.poradnikFirma, S.uzArt2a],
    checked: CHECKED_LAW,
    uwagi:
      "Trzy ryzyka z treści zadania ZUS (s. 9–10, pkt H): pozorna umowa lub działalność, podwyższenie podstawy w ciąży, brak ubezpieczenia na dzień porodu. Poradnik ZUS 2026 (s. 9, 12) opisuje pozorną umowę o pracę i zlecenia oraz badanie wysokości wynagrodzenia. O obniżeniu podstawy po podwyżce w ciąży mówi treść zadania (s. 10). Pozorną działalność gospodarczą treść zadania wymienia, ale korpus jej nie opisuje, dlatego w tekście jej nie ma. Kod reguł tego nie liczy: to informacja.",
  },

  "zasilek-likwidacja": {
    paragraphs: [
      "Jeśli w ciąży Twoja umowa o pracę wygaśnie z powodu śmierci pracodawcy albo pracodawca rozwiąże ją z powodu ogłoszenia upadłości lub likwidacji i nie zapewni Ci innego zatrudnienia, do dnia porodu dostajesz zasiłek w wysokości zasiłku macierzyńskiego.",
      "Zasiłek wynosi tyle, co zasiłek macierzyński za okres urlopu macierzyńskiego, czyli 100% podstawy wymiaru. Podstawę ustala się tak samo jak przy zasiłku macierzyńskim.",
      "Po porodzie przysługuje Ci zasiłek macierzyński, choć ubezpieczenie ustało w czasie ciąży.",
      "Zasiłek macierzyński po ustaniu ubezpieczenia przysługuje też wtedy, gdy umowę rozwiązano z Tobą w ciąży z naruszeniem prawa, a stwierdził to prawomocny wyrok sądu.",
      "Zasiłek za okres po ustaniu ubezpieczenia wypłaca ZUS, a nie były pracodawca.",
      "Do wniosku dołącz: zaświadczenie lekarskie na zwykłym druku, że byłaś w ciąży w czasie zatrudnienia, świadectwo pracy albo inny dokument z przyczyną końca umowy oraz oświadczenie, że nie zapewniono Ci innego zatrudnienia.",
      "Ten zasiłek dotyczy tylko pracownic, czyli osób zatrudnionych na umowę o pracę.",
    ],
    sources: [S.uzArt30, S.rzPar17, S.uzArt61],
    checked: CHECKED_LAW,
    uwagi:
      "Art. 30 ust. 3 ustawy zasiłkowej daje zasiłek w wysokości zasiłku macierzyńskiego do dnia porodu tylko przy śmierci, upadłości lub likwidacji pracodawcy. Treść zadania (s. 4) dopisuje do tej listy naruszenie prawa przy rozwiązaniu umowy, ale ustawa wiąże je wyłącznie z zasiłkiem macierzyńskim po porodzie (art. 30 ust. 1 pkt 2) i tak to opisujemy. 100% podstawy: treść zadania (s. 4) i art. 31 ust. 1. Podstawa: art. 47. Wypłata przez ZUS: art. 61 ust. 1 pkt 2 lit. d.",
  },

  "swiadczenie-rehabilitacyjne": {
    paragraphs: [
      "Zasiłek chorobowy w ciąży przysługuje najdłużej przez 270 dni, czyli przez okres zasiłkowy. Wlicza się do niego zwolnienia bez przerwy oraz zwolnienia z przerwą krótszą niż 61 dni.",
      "Jeśli po wykorzystaniu zasiłku chorobowego nadal nie możesz pracować, a dalsze leczenie lub rehabilitacja lecznicza rokują odzyskanie zdolności do pracy, przysługuje Ci świadczenie rehabilitacyjne.",
      "Przysługuje przez czas potrzebny do odzyskania zdolności do pracy, najdłużej przez 12 miesięcy.",
      "O tym, czy świadczenie Ci przysługuje i na jak długo, orzeka lekarz orzecznik ZUS. Od jego orzeczenia możesz wnieść sprzeciw do komisji lekarskiej ZUS. Orzeczenie jest podstawą decyzji o świadczeniu.",
      "Świadczenie wynosi 90% podstawy wymiaru zasiłku chorobowego przez pierwsze 3 miesiące i 75% przez pozostały okres. Jeśli niezdolność do pracy przypada w okresie ciąży, wynosi 100% podstawy.",
      "Nie przysługuje m.in. osobie, która ma prawo do emerytury, renty z tytułu niezdolności do pracy albo zasiłku dla bezrobotnych.",
      "We wniosku o świadczenie część wypełniasz Ty, a część płatnik składek i płatnik zasiłku chorobowego, np. pracodawca.",
    ],
    sources: [S.poradnikSick, S.uzArt18, S.uzArt19, S.rzZal5],
    checked: CHECKED_LAW,
    uwagi: "Treść zadania ZUS, s. 12, pkt a. Kod reguł nie liczy tego świadczenia: to informacja.",
  },

  "macierzynski-przed": {
    paragraphs: [
      "Przed porodem możesz wykorzystać najwyżej 6 tygodni urlopu macierzyńskiego i zasiłku macierzyńskiego.",
      "Ten czas odlicza się od całego urlopu, np. 20 tygodni przy jednym dziecku. Po porodzie wykorzystujesz pozostałą część. Jeśli nie zaczniesz urlopu wcześniej, zaczyna się on w dniu porodu.",
      "Podaj pracodawcy dzień, od którego chcesz rozpocząć urlop. Dołącz kopię zaświadczenia lekarskiego o przewidywanej dacie porodu, chyba że jest już w Twoich aktach osobowych.",
      "Zasiłek za urlop macierzyński wynosi 100% podstawy albo 81,5%, jeśli w ciągu 21 dni po porodzie złożysz wniosek o zasiłek za cały okres.",
    ],
    sources: [S.govMaternity, S.leaveRequests, S.zusMaternity],
    checked: CHECKED_LAW,
  },

  "zaplanuj-urlopy": {
    paragraphs: [
      "Najpierw wybierz sposób wypłaty zasiłku. Domyślnie dostajesz 100% podstawy za urlop macierzyński i 70% za rodzicielski.",
      "Druga możliwość to 81,5% za cały okres urlopu macierzyńskiego i rodzicielskiego. Trzeba wtedy złożyć wniosek najpóźniej 21 dni po porodzie: o zasiłek za cały okres albo za urlop macierzyński z deklaracją, że wykorzystasz pełny urlop rodzicielski.",
      "81,5% nie obejmuje 9 tygodni urlopu rodzicielskiego zastrzeżonych dla drugiego rodzica. Za tę część zasiłek wynosi 70%.",
      "Jeśli w pierwszym roku życia dziecka nie weźmiesz ani jednego dnia płatnego urlopu rodzicielskiego, zasiłek za ten urlop wyniesie 70%. Za urlop macierzyński dostaniesz wtedy na wniosek jednorazowe wyrównanie do 100%.",
    ],
    sources: [S.zusAmount, S.govParental],
    checked: CHECKED,
  },

  przesiewowe: {
    paragraphs: [
      "Badania przesiewowe noworodków to program finansowany przez Ministerstwo Zdrowia. Pozwala wcześnie wykryć choroby i wady wrodzone, które bez leczenia mogą prowadzić do upośledzenia umysłowego lub fizycznego.",
      "Na oddziale położniczym pobiera się dziecku kilka kropli krwi na specjalną bibułę. Po wysuszeniu bibuła trafia do jednego z regionalnych laboratoriów.",
      "Badania organizuje i nadzoruje Zakład Badań Przesiewowych i Diagnostyki Metabolicznej Instytutu Matki i Dziecka.",
      "Jeśli wynik wskazuje na możliwą chorobę, rodzice dostają skierowanie do lekarza specjalisty.",
    ],
    sources: [S.screening],
    checked: CHECKED,
    uwagi:
      "Strona podaje, że krew pobiera się na oddziale położniczym, a badanie wykonują regionalne laboratoria IMiD. Sformułowanie `why`, że badanie „wykonuje szpital”, jest więc uproszczeniem. Strona nie podaje doby pobrania, kosztu ani sposobu przekazania wyniku. Obecny program ma w nazwie lata 2019–2026.",
  },

  z3: {
    paragraphs: [
      "Jeśli Twój pracodawca zgłasza do ubezpieczenia chorobowego nie więcej niż 20 osób, zasiłek macierzyński ustala i wypłaca ZUS, a nie pracodawca. Większy pracodawca wypłaca zasiłki sam.",
      "Liczbę ubezpieczonych ustala się na cały rok kalendarzowy według stanu z 30 listopada poprzedniego roku.",
      "Gdy zasiłek wypłaca ZUS, potrzebne jest zaświadczenie płatnika składek na druku Z-3. Wystawia je pracodawca i podaje w nim dane o wynagrodzeniu do podstawy zasiłku.",
      "Wnioski i zaświadczenia od Ciebie, pracodawcy i lekarza można złożyć w ZUS papierowo albo elektronicznie przez PUE/eZUS.",
    ],
    sources: [S.zusPayers, S.zusDocs],
    checked: CHECKED,
    uwagi:
      "Strony ZUS potwierdzają próg 20 ubezpieczonych i wymóg Z-3. Nie mówią wprost, że pracodawca przekazuje Z-3 „razem z Twoim wnioskiem”, piszą tylko, że wnioski i zaświadczenia składają ubezpieczony, płatnik i lekarz. Dodano źródło „Płatnicy zasiłku”.",
  },

  "zglos-urodzenie": {
    paragraphs: [
      "Urodzenie dziecka zgłasza matka albo ojciec w ciągu 21 dni od wystawienia karty urodzenia. Kartę wystawia lekarz lub położna i w ciągu 3 dni przekazuje ją do urzędu stanu cywilnego.",
      "W urzędzie zgłaszasz urodzenie w USC właściwym dla miejsca urodzenia, z dowodem osobistym lub paszportem. Online potrzebujesz profilu zaufanego, e-dowodu albo podpisu kwalifikowanego, a od 1 stycznia 2026 r. także adresu do e-Doręczeń.",
      "Możesz też skorzystać z usługi „Zgłoś urodzenie dziecka” w aplikacji mObywatel. Zgłoszenie jest bezpłatne. Jeśli urząd ma kartę urodzenia, sporządzi akt w dniu wizyty albo następnego dnia roboczego po zgłoszeniu online.",
      "Dostajesz jeden bezpłatny odpis skrócony aktu urodzenia, powiadomienie o nadaniu numeru PESEL i potwierdzenie zameldowania, jeśli dziecko zostało zameldowane.",
      "Jeśli nie zgłosisz urodzenia w terminie, kierownik USC sam wybierze dziecku imię i zarejestruje urodzenie na podstawie karty urodzenia.",
    ],
    sources: [S.usc, S.uscApp],
    checked: "2026-11-22",
  },

  "zasilek-macierzynski": {
    paragraphs: [
      "Zasiłek macierzyński za okres urlopu macierzyńskiego i rodzicielskiego może wynosić 81,5% podstawy. Warunek: najpóźniej 21 dni po porodzie złożysz wniosek o zasiłek za cały ten okres albo za urlop macierzyński z deklaracją, że wykorzystasz pełny urlop rodzicielski.",
      "Bez takiego wniosku w terminie dostaniesz 100% za urlop macierzyński i 70% za rodzicielski.",
      "Do wniosku podajesz dane dziecka: imię i nazwisko, PESEL, datę i miejsce urodzenia, a także imię, nazwisko i PESEL drugiego rodzica.",
      "Sprawdź w kadrach, kto wypłaca zasiłek. Jeśli pracodawca, przekaż mu podpisany wydruk albo dokument elektroniczny zgodnie z zasadami w firmie. Dołącz skrócony odpis aktu urodzenia lub jego kopię.",
      "Jeśli wypłaca ZUS, możesz przekazać dokumenty przez kadry lub złożyć wniosek w ZUS osobiście, pocztą, przez eZUS albo e-Doręczenia. Pracodawca przekazuje zaświadczenie Z-3. ZUS pobiera polski akt z rejestru i może poprosić o odpis, jeżeli go nie uzyska.",
      "Deklaracja na druku ZAM przewiduje co najmniej jeden dzień urlopu rodzicielskiego w pierwszym roku życia dziecka. Dziewięć tygodni przysługujących wyłącznie drugiemu rodzicowi pozostaje płatne w wysokości 70%.",
      "Zasiłek nie może być niższy niż 1000 zł miesięcznie po odjęciu zaliczki na podatek, bo płatnik podnosi go do tej kwoty.",
    ],
    sources: [S.zusAmount, S.zusDocs, S.zusPayers, { label: "Rozporządzenie z 27.09.2026 r., § 13", url: "https://eli.gov.pl/eli/DU/2026/1316/ogl" }, { label: "ZUS · Kanały składania wniosków", url: "https://www.zus.pl/o-zus/aktualnosci/-/asset_publisher/aktualnosci/content/id/14233105" }],
    checked: CHECKED_LAW,
  },

  "urlop-macierzynski": {
    paragraphs: [
      "Urlop macierzyński trwa 20 tygodni przy jednym dziecku. Przy porodzie mnogim trwa 31, 33, 35 albo 37 tygodni, zależnie od liczby dzieci.",
      "Jeśli nie korzystałaś z urlopu przed porodem, Twój urlop rozpoczyna się w dniu porodu z mocy prawa. Nie musisz składać wniosku o jego udzielenie.",
      "Matka musi wykorzystać co najmniej 14 tygodni po porodzie. Resztę może przejąć ojciec wychowujący dziecko. Wniosek o rezygnację z części urlopu składasz co najmniej 7 dni przed powrotem do pracy, a wniosek ojca o tę część co najmniej 14 dni przed jej rozpoczęciem.",
      "Za urlop przysługuje zasiłek macierzyński: 100% podstawy albo 81,5%, jeśli wniosek o taki zasiłek złożysz najpóźniej 21 dni po porodzie.",
      "W ciąży i w czasie urlopu pracodawca nie może wypowiedzieć umowy ani przygotowywać jej rozwiązania, z nielicznymi wyjątkami, np. upadłości lub likwidacji firmy.",
    ],
    sources: [S.govMaternity, S.zusMaternity],
    checked: CHECKED_LAW,
  },

  "ubezpieczenie-dziecka": {
    paragraphs: [
      "Rejestracja urodzenia w USC nie zgłasza dziecka automatycznie do ubezpieczenia zdrowotnego. Trzeba je zgłosić jako członka rodziny osoby ubezpieczonej.",
      "Masz na to 7 dni od nadania dziecku numeru PESEL.",
      "Jako pracownik przekazujesz dane kadrom. Pracodawca składa do ZUS druk ZCNA w ciągu 7 dni od otrzymania informacji. Wystarczy zgłoszenie przez jednego rodzica. Przedsiębiorca składa ZCNA sam, a osoba zarejestrowana jako bezrobotna przekazuje dane urzędowi pracy.",
      "Zgłoszenie nic nie kosztuje. Za członka rodziny nie płaci się dodatkowej składki, a dziecko korzysta z bezpłatnych świadczeń NFZ.",
      "Dziecko może być zgłoszone do 18. roku życia, a jeśli się uczy, do 26. roku życia. Przy znacznym stopniu niepełnosprawności lub równoważnym orzeczeniu nie ma limitu wieku.",
    ],
    sources: [S.nfzInsurance, { label: "ZUS · Poradnik ZCNA dla płatnika", url: "https://www.zus.pl/documents/10182/167567/ZUS_ZCNA.pdf" }],
    checked: CHECKED_LAW,
  },

  odpis: {
    paragraphs: [
      "Przy zgłoszeniu urodzenia dostajesz jeden bezpłatny odpis skrócony aktu urodzenia.",
      "Odpis skrócony zawiera aktualną treść aktu, a odpis zupełny całą treść razem z późniejszymi zmianami. Jest też odpis wielojęzyczny, wydawany tylko na papierze, który w niektórych krajach UE nie wymaga tłumaczenia.",
      "Wniosek przekaż do dowolnego USC w Polsce osobiście, listownie albo przez gov.pl. Papierowy odpis odbierzesz w urzędzie lub pocztą. Elektroniczny trafi na Twoją skrzynkę do e-Doręczeń.",
      "Każdy dodatkowy odpis kosztuje zwykle 22 zł za skrócony lub wielojęzyczny i 33 zł za zupełny. Wskaż we wniosku konkretny cel. Między innymi w sprawach ubezpieczenia społecznego i alimentów odpis jest bezpłatny.",
    ],
    sources: [S.usc, S.odpisInfo],
    checked: "2026-11-22",
  },

  "urlop-ojcowski": {
    paragraphs: [
      "Ojciec wychowujący dziecko ma prawo do urlopu ojcowskiego do 2 tygodni. Musi go wykorzystać, zanim dziecko skończy 12 miesięcy.",
      "Urlop można wziąć w całości albo w dwóch częściach, każda co najmniej tydzień.",
      "Podaj pracodawcy pierwszy i ostatni dzień urlopu. Pismo złóż na papierze lub elektronicznie co najmniej 7 dni wcześniej. Dołącz odpis skrócony aktu urodzenia lub kopię i oświadczenie o wcześniejszym wykorzystaniu urlopu. Dokumentów z akt osobowych nie trzeba składać ponownie.",
      "Po przysposobieniu dołącz kopię prawomocnego postanowienia sądu. Urlop wykorzystaj w ciągu 12 miesięcy od jego uprawomocnienia, zanim dziecko ukończy 14 lat.",
      "Za urlop ojcowski zasiłek macierzyński wynosi 100% podstawy. To samodzielne prawo ojca, niezależne od uprawnień matki.",
    ],
    sources: [S.govPaternity, S.leaveRequests, S.zusPaternity],
    checked: CHECKED_LAW,
  },

  "800plus": {
    paragraphs: [
      "Świadczenie wychowawcze 800+ wynosi 800 zł miesięcznie na każde dziecko do 18. roku życia, bez względu na dochód rodziny.",
      "Rodzic składa do ZUS wniosek SW-R tylko elektronicznie: przez eZUS, aplikację mZUS, portal Emp@tia albo bankowość elektroniczną.",
      "Jeśli wniosek na noworodka złożysz w ciągu 3 miesięcy od urodzenia, świadczenie przysługuje od dnia urodzenia, z wyrównaniem.",
      "Wniosek złożony później daje świadczenie dopiero od miesiąca jego złożenia, bez wyrównania za wcześniejsze miesiące.",
      "Świadczenie przyznaje się na okres od 1 czerwca do 31 maja następnego roku. Za miesiąc urodzenia ZUS wypłaca kwotę proporcjonalną do liczby dni.",
    ],
    sources: [S.zus800, S.zus800Term],
    checked: CHECKED,
    uwagi: "Wniosek na kolejny okres możesz złożyć od 1 lutego. Informację o przyznaniu świadczenia znajdziesz na swoim koncie eZUS.",
  },

  poz: {
    paragraphs: [
      "Wybierasz osobno lekarza, pielęgniarkę lub położną. Podpisany druk możesz złożyć w przychodni. Dokument elektroniczny przekaż drogą uzgodnioną z placówką i podpisz podpisem zaufanym, osobistym albo kwalifikowanym.",
      "Automatyczny dostęp do IKP dziecka ma rodzic, który zgłosił je do ubezpieczenia w ZUS lub KRUS. Drugi rodzic może dostać dostęp przez upoważnienie.",
      "W przeglądarce przejdź na konto dziecka w IKP. W sekcji POZ wybierz przychodnię i osobę, prześlij deklarację i sprawdź jej status. W aplikacji mojeIKP znajdziesz dane kontaktowe.",
      "Przychodnia może odrzucić deklarację, np. gdy lekarz ma pełną listę pacjentów. Wtedy skontaktuj się z nią bezpośrednio.",
      "Pierwsze dwa wybory w roku kalendarzowym są bezpłatne. Następny kosztuje 80 zł, chyba że zachodzi ustawowy wyjątek, np. przeprowadzka lub zaprzestanie udzielania świadczeń.",
    ],
    sources: [S.poz, S.pozDruki, S.pozUstawa],
    checked: "2026-11-22",
  },

  rodzicielski: {
    paragraphs: [
      "Urlop rodzicielski trwa do 41 tygodni przy jednym dziecku i do 43 przy porodzie mnogim. Przy zaświadczeniu „Za życiem” trwa do 65 lub 67 tygodni. Rodzice dzielą go między siebie.",
      "Każdy z rodziców ma 9 tygodni tylko dla siebie i nie może ich przekazać drugiemu.",
      "Wniosek składasz pracodawcy na papierze lub elektronicznie, co najmniej 21 dni przed rozpoczęciem urlopu. Pracodawca musi go uwzględnić. Urlop można podzielić najwyżej na 5 części i wykorzystać do końca roku, w którym dziecko kończy 6 lat.",
      "Zasiłek za urlop rodzicielski wynosi 70% podstawy albo 81,5%, jeśli wniosek o zasiłek za cały okres złożono w ciągu 21 dni po porodzie. Za 9 tygodni drugiego rodzica zawsze wynosi 70%.",
      "Wskaż dotychczasowe wykorzystanie urlopu lub zasiłku i liczbę części. Przy urodzeniu dziecka dołącz odpis skrócony aktu urodzenia lub kopię i oświadczenie, czy drugi rodzic będzie korzystać równocześnie. Przy dłuższym wymiarze dołącz kopię zaświadczenia „Za życiem”. Dokumenty z akt osobowych możesz pominąć.",
      "Do łączenia urlopu z pracą służy osobny wniosek. W planie znajdziesz go jako „Łączenie urlopu rodzicielskiego z pracą”.",
    ],
    sources: [S.govParental, S.leaveRequests, S.zusParental],
    checked: CHECKED_LAW,
  },

  "rodzicielski-praca": {
    paragraphs: [
      "Złóż osobny wniosek u pracodawcy udzielającego urlopu co najmniej 21 dni przed rozpoczęciem pracy. Możesz go przekazać na papierze albo elektronicznie.",
      "Wskaż daty i wymiar pracy, do połowy pełnego etatu. Oświadcz, czy podczas części powstałej z wydłużenia urlopu też zamierzasz pracować. Jeśli tak, podaj również wymiar tej pracy.",
      "Pracodawca uwzględnia wniosek, chyba że organizacja lub rodzaj pracy na to nie pozwala. Powód odmowy podaje w ciągu 7 dni od otrzymania wniosku.",
    ],
    sources: [S.govParental, S.leaveRequests],
    checked: CHECKED_LAW,
  },

  szczepienia: {
    paragraphs: [
      "Kalendarz szczepień, czyli Program Szczepień Ochronnych, co roku ogłasza Główny Inspektor Sanitarny. Zawiera szczepienia obowiązkowe i zalecane.",
      "Szczepienia obowiązkowe są bezpłatne, finansowane z budżetu państwa i wykonywane do 19. roku życia. Obejmują m.in. gruźlicę, WZW B, rotawirusy, błonicę, tężec, krztusiec, polio, Hib, pneumokoki, odrę, świnkę i różyczkę.",
      "Niektóre szczepienia zalecane są bezpłatne, np. przeciw grypie od 6. miesiąca życia. Inne, np. przeciw meningokokom lub ospie wietrznej poza grupami ryzyka, są płatne.",
      "Możesz wybrać płatne szczepionki wysoce skojarzone, co oznacza mniej wkłuć i wizyt.",
      "Przed szczepieniem lekarz kwalifikuje dziecko i w razie potrzeby może ustalić dla niego indywidualny kalendarz.",
    ],
    sources: [S.vaccines],
    checked: CHECKED,
    uwagi: "Strona nie podaje dokładnych terminów szczepień w pierwszym roku życia i odsyła do kalendarza na stronie PZH.",
  },

  becikowe: {
    paragraphs: [
      "Becikowe to jednorazowe 1000 zł z tytułu urodzenia dziecka. Wnioskuje rodzic, opiekun prawny albo opiekun faktyczny.",
      "Przysługuje, gdy dochód rodziny na osobę nie przekracza 1922 zł netto miesięcznie.",
      "Matka musi być pod opieką lekarza lub położnej od co najmniej 10. tygodnia ciąży do porodu. Potwierdza to zaświadczenie od lekarza lub położnej. Wymóg nie dotyczy opiekunów prawnych, faktycznych ani rodziców adopcyjnych.",
      "Złóż SR-2 w gminie lub OPS właściwym dla miejsca zamieszkania, wyślij pocztą albo złóż wniosek elektroniczny przez Emp@tię. Rodzic ma 12 miesięcy od urodzenia, a przy przysposobieniu lub objęciu opieką prawną albo faktyczną termin biegnie od tego zdarzenia, do ukończenia przez dziecko 18 lat.",
      "Jeśli samotnie wychowujesz dziecko, przygotuj tytuł alimentacyjny albo dokument potwierdzający ustawowy wyjątek, np. akt zgonu drugiego rodzica lub orzeczenie o opiece naprzemiennej.",
      "Wniosek złożony po terminie nie zostanie rozpatrzony. Decyzja zapada zwykle w ciągu miesiąca.",
    ],
    sources: [S.becikowe],
    checked: CHECKED,
    uwagi: "Gmina oblicza dochód rodziny. Przy wnioskach składanych od listopada 2026 do października 2027 bierze pod uwagę rok 2025 oraz późniejsze uzyskanie lub utratę dochodu.",
  },

  "aktywny-rodzic": {
    paragraphs: [
      "Program Aktywny Rodzic obejmuje trzy świadczenia na dziecko w wieku od 12 do 35 miesięcy. W danym miesiącu można pobierać tylko jedno z nich, ale można je zmieniać.",
      "„Aktywni rodzice w pracy” to 1500 zł miesięcznie (1900 zł przy niepełnosprawności dziecka). Oboje rodzice muszą pracować i mieć podstawę składek emerytalnych i rentowych co najmniej 50% minimalnego wynagrodzenia każde, a łącznie co najmniej 100%.",
      "„Aktywnie w żłobku” to do 1500 zł miesięcznie (1900 zł przy niepełnosprawności), nie więcej niż opłata za pobyt. Pieniądze trafiają prosto do placówki, a praca rodziców nie jest warunkiem.",
      "„Aktywnie w domu” to 500 zł miesięcznie, bez wymogu pracy rodziców.",
      "Świadczenia nie zależą od dochodu i łączą się z 800+. Wypłaca je ZUS, a wniosek składasz tylko elektronicznie: przez PUE ZUS, mZUS, bankowość elektroniczną lub Emp@tię.",
    ],
    sources: [S.aktywny],
    checked: CHECKED,
    uwagi:
      "Strona to starsze pytania i odpowiedzi. Podaje 1 października 2024 r. jako planowaną datę wejścia ustawy w życie.",
  },

  powrot: {
    paragraphs: [
      "W ciąży i w czasie urlopu macierzyńskiego, ojcowskiego i rodzicielskiego pracodawca nie może wypowiedzieć umowy ani przygotowywać jej rozwiązania.",
      "Ochrona zaczyna się od złożenia wniosku o urlop, ale nie wcześniej niż 14 dni przed urlopem macierzyńskim, 21 dni przed rodzicielskim i 7 dni przed ojcowskim. Trwa do końca urlopu.",
      "Wyjątki to upadłość lub likwidacja pracodawcy oraz zwolnienie dyscyplinarne z winy pracownika, za zgodą związku zawodowego, jeśli działa w firmie.",
      "Po urlopie pracodawca dopuszcza Cię do pracy na tym samym stanowisku. Gdy to niemożliwe, na równorzędnym stanowisku, na warunkach nie gorszych niż wcześniej.",
      "Jeśli po urlopie pracujesz w obniżonym wymiarze czasu pracy, ochrona trwa do powrotu na pełny etat, najdłużej rok od złożenia wniosku.",
    ],
    sources: [S.govRights, S.govParental, S.bizProtected],
    checked: CHECKED,
    uwagi:
      "Źródło w fixtures (strona główna pip.gov.pl) nie zawiera tych informacji, a strony PIP blokują automatyczny dostęp weryfikacją „nie jestem robotem”. Zmieniono je na gov.pl (MRPiPS) i biznes.gov.pl.",
  },

  praca: {
    paragraphs: [
      "Umowa na czas określony albo na okres próbny dłuższy niż miesiąc, która skończyłaby się po 3. miesiącu ciąży, przedłuża się do dnia porodu.",
      "Przedłużenie następuje z mocy prawa, bez wniosku i bez aneksu. Nie dotyczy umowy zawartej na zastępstwo nieobecnego pracownika.",
      "W ciąży pracodawca nie może wypowiedzieć umowy ani jej rozwiązać, z wyjątkiem upadłości lub likwidacji firmy albo zwolnienia z winy pracownicy za zgodą związku zawodowego. Ochrona działa od stwierdzenia ciąży zaświadczeniem lekarskim.",
      "Jeśli wypowiedzenie doręczono, zanim pracodawca wiedział o ciąży, a w okresie wypowiedzenia dostanie on zaświadczenie lekarskie, musi wypowiedzenie wycofać.",
      "Kobieta w ciąży nie może pracować w nadgodzinach ani w nocy. Pracodawca musi też zwolnić ją na zalecone badania lekarskie, jeśli nie da się ich zrobić poza pracą, i zapłacić za ten czas.",
    ],
    sources: [S.govRights, S.bizProtected],
    checked: CHECKED,
    uwagi:
      "Źródło w fixtures (strona główna pip.gov.pl) nie zawiera tych informacji, a strony PIP blokują automatyczny dostęp. Zmieniono je na gov.pl (MRPiPS) i biznes.gov.pl. ZUS potwierdza, że przy umowie przedłużonej do porodu przysługuje zasiłek macierzyński (zus.pl · zasiłek za okres urlopu macierzyńskiego).",
  },
};
