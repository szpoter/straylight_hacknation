/** Organizacje i sprawy z SPEC-PO-LOGOWANIU, „Widok Wsparcie” (sprawdzone 21.11.2026). Tylko podmioty charytatywne. */

export type Organization = { id: string; name: string; help: string; forWhom: string; url: string; free?: boolean };

export const ORGANIZATIONS: Record<string, Organization> = {
  ernest: {
    id: "ernest",
    name: "Fundacja Ernesta",
    help: "Kierowanie do wsparcia psychologicznego, doradztwo prawne o uprawnieniach, bezpłatna diagnostyka, edukacja",
    forWhom: "Po poronieniu, martwym urodzeniu, w trudnych sytuacjach okołoporodowych",
    url: "https://fundacjaernesta.pl/jak-pomagamy/",
  },
  gajusz: {
    id: "gajusz",
    name: "Fundacja Gajusz — hospicjum perinatalne",
    help: "Opieka lekarska, położnicza i psychologiczna w ciąży, przy porodzie i po nim",
    forWhom: "Rodziny dziecka nieuleczalnie chorego przed narodzinami",
    url: "https://gajusz.org.pl/hospicjum-perinatalne/",
    free: true,
  },
  hospicjum: {
    id: "hospicjum",
    name: "Fundacja Warszawskie Hospicjum dla Dzieci",
    help: "Hospicjum perinatalne, opieka paliatywna nad noworodkiem, grupy wsparcia w żałobie, konsultacje psychologiczne",
    forWhom: "Rodzice i rodzeństwo",
    url: "https://hospicjum.waw.pl/",
  },
  wczesniak: {
    id: "wczesniak",
    name: "Fundacja Wcześniak Rodzice-Rodzicom",
    help: "Poradnik, wypożyczalnia sprzętu, program mentorski, grupy wsparcia, infolinia",
    forWhom: "Rodzice wcześniaków",
    url: "https://www.wczesniak.pl/",
    free: true,
  },
  koalicja: {
    id: "koalicja",
    name: "Fundacja Koalicja dla Wcześniaka",
    help: "Poradniki, informacje o pierwszych dniach i opiece w domu",
    forWhom: "Rodzice wcześniaków",
    url: "https://koalicjadlawczesniaka.pl/",
  },
};

export type Situation = { id: string; title: string; orgs: string[]; formal: string[] };

export const SITUATIONS: Situation[] = [
  {
    id: "strata",
    title: "Strata dziecka lub poronienie",
    orgs: ["ernest", "hospicjum"],
    formal: [
      "Przy martwym urodzeniu lub zgonie dziecka karta sprawy zasiłkowej pokaże, jakie uprawnienia Ci przysługują.",
      "Przypomnienia rozwojowe możesz wyciszyć, przełączając plan na ścieżkę wsparcia.",
    ],
  },
  {
    id: "wczesniak",
    title: "Wcześniak",
    orgs: ["wczesniak", "koalicja"],
    formal: [
      "Uzupełniający urlop macierzyński: tydzień za tydzień pobytu w szpitalu, do 8 lub 15 tygodni według tygodnia ciąży i masy urodzeniowej.",
      "Kalkulator uwzględni hospitalizację po zaznaczeniu jej w założeniach.",
    ],
  },
  {
    id: "za-zyciem",
    title: "Ciężka choroba dziecka („Za życiem”)",
    orgs: ["gajusz", "hospicjum"],
    formal: ["Z zaświadczeniem „Za życiem” urlop rodzicielski wynosi 65 tygodni (67 przy więcej niż jednym dziecku)."],
  },
  {
    id: "rodzic",
    title: "Trudna sytuacja rodzica",
    orgs: [],
    formal: ["Ochrona przed zwolnieniem obowiązuje w ciąży i w czasie urlopów związanych z rodzicielstwem."],
  },
];
