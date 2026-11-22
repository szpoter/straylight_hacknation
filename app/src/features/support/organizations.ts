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

/** Zdanie o sprawach formalnych. Twierdzenie o przepisach zawsze ze źródłem (sprawdzone 21.11.2026). */
export type Formal = { text: string; source?: { label: string; url: string } };

export type Situation = { id: string; title: string; orgs: string[]; formal: Formal[] };

const GOV_PARENTAL = { label: "gov.pl · Urlop rodzicielski", url: "https://www.gov.pl/web/rodzina/urlop-rodzicielski" };
const GOV_SUPPLEMENTARY = { label: "gov.pl · Uzupełniający urlop macierzyński", url: "https://www.gov.pl/web/rodzina/uzupelniajacy-urlop-macierzynski" };
const ASK_ZUSIK: Formal = { text: "O swoją sytuację możesz zapytać Zusika — odpowiedź pokaże przepis i źródło." };

export const SITUATIONS: Situation[] = [
  {
    id: "strata",
    title: "Strata dziecka lub poronienie",
    orgs: ["ernest", "hospicjum"],
    formal: [ASK_ZUSIK],
  },
  {
    id: "wczesniak",
    title: "Wcześniak",
    orgs: ["wczesniak", "koalicja"],
    formal: [
      {
        text: "Uzupełniający urlop macierzyński: tydzień urlopu za każdy tydzień pobytu dziecka w szpitalu — do 15. tygodnia po porodzie (poród przed 28. tygodniem ciąży lub masa do 1000 g) albo do 8. tygodnia w pozostałych przypadkach.",
        source: GOV_SUPPLEMENTARY,
      },
    ],
  },
  {
    id: "za-zyciem",
    title: "Ciężka choroba dziecka („Za życiem”)",
    orgs: ["gajusz", "hospicjum"],
    formal: [{ text: "Z zaświadczeniem „Za życiem” urlop rodzicielski wynosi do 65 tygodni (do 67 przy porodzie mnogim).", source: GOV_PARENTAL }],
  },
  {
    id: "rodzic",
    title: "Trudna sytuacja rodzica",
    orgs: [],
    formal: [ASK_ZUSIK],
  },
];
