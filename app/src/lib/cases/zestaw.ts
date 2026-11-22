import type { EligibilityFacts, EligibilityStatus } from "@/lib/rules/maternity-eligibility";

/**
 * Sprawy z zestawu ZUS do zadania (folder „Sprawy”), przepisane do faktów potrzebnych regule
 * `assessMaternityEligibility`. Bez nazwisk, numerów i plików: akt nie wolno kopiować ani
 * rozpowszechniać (zadanie s. 11–12). Identyfikator to numer z nazwy pliku w zestawie i
 * pierwsze litery miasta oddziału, żeby zespół i jury mogli odnaleźć oryginał.
 *
 * Fakty odczytano z dokumentów w aktach 22.11.2026 (OCR i podgląd stron). Pole `source` mówi,
 * z którego dokumentu pochodzi rozstrzygający fakt. Test `tests/zestaw.test.ts` porównuje wynik
 * reguły z wynikiem ZUS dla każdej sprawy.
 */

export interface ZestawCase {
  id: string;
  /** Nazwa pliku w zestawie bez imienia i pierwszej litery nazwiska. */
  fileHint: string;
  title: string;
  /** Krótki opis stanu faktycznego, bez danych osobowych. */
  story: string;
  facts: EligibilityFacts;
  /** Wynik ZUS z akt i jego odpowiednik w statusach reguły. */
  zus: { status: Exclude<EligibilityStatus, "brak-danych">; text: string };
  /** Skąd pochodzą rozstrzygające fakty. */
  source: string;
}

export const ZESTAW: ZestawCase[] = [
  {
    id: "zab-3",
    fileHint: "Zab_3 · Odmowa zas. macierzyńskiego, umowa dla pozoru",
    title: "Umowa o pracę uznana za zawartą dla pozoru",
    story: "Pracownica zatrudniona od 3.11.2025, poród 13.01.2026. ZUS ustalił, że od początku zatrudnienia nie podlegała ubezpieczeniom, bo umowę zawarto dla pozoru.",
    facts: {
      applicant: "rodzi",
      event: "porod",
      eventDate: "2026-01-13",
      title: "pracownik",
      insured: "nie",
      notSubjectDecision: true,
    },
    zus: { status: "nie-przysluguje", text: "Decyzja odmawiająca prawa do zasiłku macierzyńskiego. Podstawa: decyzja o niepodleganiu ubezpieczeniom od 3.11.2025 (art. 83 § 1 Kodeksu cywilnego)." },
    source: "Odpis aktu urodzenia, decyzja ZUS o niepodleganiu ubezpieczeniom",
  },
  {
    id: "lod-5",
    fileHint: "Łód_5 · Zas. macierzyński, odmowa, nie podlega ubezp. chorobowemu na dzień porodu",
    title: "Brak ubezpieczenia chorobowego w dniu porodu",
    story: "Pracownica, poród 12.06.2025. Wcześniejsza decyzja ZUS: nie podlega ubezpieczeniom jako pracownik od 4.10.2024.",
    facts: {
      applicant: "rodzi",
      event: "porod",
      eventDate: "2025-06-12",
      title: "pracownik",
      insured: "nie",
      notSubjectDecision: true,
    },
    zus: { status: "nie-przysluguje", text: "Decyzja: odmowa prawa do zasiłku macierzyńskiego za okres od 12.06.2025 do 10.06.2026 (art. 29 ust. 1 pkt 1)." },
    source: "Decyzja ZUS, odpis aktu urodzenia, odpowiedź na wniosek o zbadanie podlegania",
  },
  {
    id: "gd-5",
    fileHint: "Gd_5 · Zas. mac., odmowa, brak zgłoszenia do ubezpieczeń",
    title: "Przedsiębiorczyni bez ponownego zgłoszenia do ubezpieczenia",
    story:
      "Działalność gospodarcza. Zasiłek macierzyński pobierany od 6.09.2025 do 23.01.2026. Od 24.01.2026 nie zgłosiła się ponownie do ubezpieczeń, a o zasiłek za urlop rodzicielski wnioskowała od 6.02.2026.",
    facts: {
      applicant: "rodzi",
      event: "porod",
      eventDate: "2025-09-06",
      periodStart: "2026-02-06",
      title: "dzialalnosc",
      insured: "nie",
    },
    zus: { status: "nie-przysluguje", text: "Decyzja: odmowa prawa do zasiłku macierzyńskiego za okres urlopu rodzicielskiego od 6.02.2026 — na ten dzień nie podlegała ubezpieczeniu chorobowemu." },
    source: "Decyzja ZUS",
  },
  {
    id: "rze-3",
    fileHint: "Rze_3 · Zas. macierzyński, umowa zlecenie bez chorobowego, odmowa",
    title: "Umowa zlecenia bez dobrowolnego ubezpieczenia chorobowego",
    story: "Zleceniobiorczyni, poród 24.08.2025. Nie zgłosiła się do dobrowolnego ubezpieczenia chorobowego.",
    facts: {
      applicant: "rodzi",
      event: "porod",
      eventDate: "2025-08-24",
      title: "zleceniobiorca",
      insured: "nie",
    },
    zus: { status: "nie-przysluguje", text: "Decyzja odmawiająca prawa do zasiłku macierzyńskiego: brak zgłoszenia do dobrowolnego ubezpieczenia chorobowego." },
    source: "Wniosek ZAM (okres od 24.08.2025), odpowiedź na wniosek o poświadczenie ubezpieczenia chorobowego",
  },
  {
    id: "wa-5",
    fileHint: "Wa I_5 · Zas. mac., osoba współpracująca, odmowa, zadłużenie z tytułu składek",
    title: "Osoba współpracująca z zadłużeniem składkowym",
    story:
      "Osoba współpracująca przy działalności. Poród 21.03.2025. Dobrowolne ubezpieczenie chorobowe trwało do dnia przed zasiłkiem i ustało przez zbieg z zasiłkiem macierzyńskim. W dniu porodu na koncie płatnika było zadłużenie składkowe, niespłacone.",
    facts: {
      applicant: "rodzi",
      event: "porod",
      eventDate: "2025-03-21",
      title: "wspolpracujacy",
      insured: "tak",
      arrears: "powyzej-progu",
      arrearsPaidOn: null,
    },
    zus: { status: "nie-przysluguje", text: "Sprawa zakończona odmową: zadłużenie z tytułu składek na dzień badania 21.03.2025, nieuregulowane." },
    source: "Zaświadczenie płatnika Z-3b, odpowiedź na wniosek o poświadczenie ubezpieczenia chorobowego",
  },
  {
    id: "cho-5",
    fileHint: "Cho_5 · Zas. mac. za okres urlopu ojcowskiego, odmowa z powodu zadłużenia, działalność",
    title: "Ojciec przedsiębiorca z zadłużeniem składkowym",
    story: "Ojciec prowadzący działalność, zasiłek za urlop ojcowski od 25.09.2025 (data urodzenia córki zakryta w aktach). W dniu powstania prawa zadłużenie przekraczało 46,66 zł (1% płacy minimalnej 2025) i nie zostało spłacone.",
    facts: {
      applicant: "drugi-rodzic",
      event: "porod",
      eventDate: "",
      periodStart: "2025-09-25",
      title: "dzialalnosc",
      insured: "tak",
      arrears: "powyzej-progu",
      arrearsPaidOn: null,
    },
    zus: { status: "nie-przysluguje", text: "Decyzja: odmowa prawa do zasiłku macierzyńskiego za okres urlopu ojcowskiego od 25.09.2025 (art. 2a)." },
    source: "Decyzja ZUS, odpowiedź na wniosek o poświadczenie ubezpieczenia chorobowego",
  },
  {
    id: "zi-4",
    fileHint: "Zi_4 · Zas. macierzyński po ustaniu ubezp., zatrudnienie do dnia porodu",
    title: "Umowa przedłużona do dnia porodu",
    story: "Pracownica zatrudniona od 4.11.2024. Umowa na czas określony przedłużona do dnia porodu 27.12.2025. Za 27.12 zasiłek wypłacił pracodawca, od 28.12 zasiłek po ustaniu zatrudnienia.",
    facts: {
      applicant: "rodzi",
      event: "porod",
      eventDate: "2025-12-27",
      title: "pracownik",
      insured: "tak",
      employmentEnd: "przedluzona-do-porodu",
      employmentEndDate: "2025-12-27",
    },
    zus: { status: "przysluguje", text: "Przyznano prawo do zasiłku macierzyńskiego." },
    source: "Zaświadczenie płatnika Z-3 (uwagi: zatrudniona do dnia porodu), tytuły ubezpieczenia z konta",
  },
  {
    id: "lod-3",
    fileHint: "Łód_3 · Zasiłek w wysokości zas. mac. i macierzyński z powodu likwidacji, przyznanie prawa",
    title: "Likwidacja pracodawcy w ciąży",
    story: "Pracownica zatrudniona od 2013 r. Umowę rozwiązano z powodu likwidacji zakładu pracy, zatrudnienie do 31.12.2023. Nie zapewniono innego zatrudnienia. Poród 24.07.2024.",
    facts: {
      applicant: "rodzi",
      event: "porod",
      eventDate: "2024-07-24",
      title: "pracownik",
      insured: "nie",
      employmentEnd: "upadlosc-likwidacja",
      employmentEndDate: "2023-12-31",
      otherEmployment: false,
    },
    zus: { status: "przysluguje", text: "Przyznano zasiłek w wysokości zasiłku macierzyńskiego do porodu oraz zasiłek macierzyński od 24.07.2024." },
    source: "Wniosek ZAS-55, świadectwo pracy (art. 30 § 1 pkt 2 KP, likwidacja), wniosek ZAM",
  },
  {
    id: "lod-4",
    fileHint: "Łód_4 · Zas. macierzyński za rodzicielski dla ojca, matka nieubezpieczona",
    title: "Ojciec na urlopie rodzicielskim, matka bez ubezpieczenia",
    story: "Ojciec zatrudniony na umowę o pracę od 2017 r. Dziecko urodzone 10.01.2024, matka nie była ubezpieczona. Zasiłek za urlop rodzicielski od 1.01.2025 do 12.08.2025.",
    facts: {
      applicant: "drugi-rodzic",
      event: "porod",
      eventDate: "2024-01-10",
      periodStart: "2025-01-01",
      title: "pracownik",
      insured: "tak",
    },
    zus: { status: "przysluguje", text: "Przyznano zasiłek macierzyński za okres urlopu rodzicielskiego." },
    source: "Wniosek ZUR, zaświadczenie płatnika Z-3",
  },
  {
    id: "war-02",
    fileHint: "War_02 · Zas. macierzyński, przyjęcie dziecka na wychowanie",
    title: "Przyjęcie dziecka na wychowanie i wniosek o przysposobienie",
    story: "Pracownica przyjęła na wychowanie dziecko urodzone 20.04.2024, 26.01.2026, po złożeniu 16.01.2026 wniosku do sądu o przysposobienie.",
    facts: {
      applicant: "rodzi",
      event: "przysposobienie",
      eventDate: "2026-01-26",
      childBirthDate: "2024-04-20",
      courtFiled: "tak",
      title: "pracownik",
      insured: "tak",
    },
    zus: { status: "przysluguje", text: "Wypłacono zasiłek macierzyński od 27.01.2026 do 15.06.2026 i za urlop rodzicielski od 16.06.2026 do 25.01.2027." },
    source: "Oświadczenie ZAS-26, odpis aktu urodzenia, zaświadczenie płatnika Z-3",
  },
];
