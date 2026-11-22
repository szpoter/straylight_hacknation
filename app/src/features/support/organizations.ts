import type { SupportSituation } from "@/lib/support/organizations";

/** Organizacje i sprawy z SPEC-PO-LOGOWANIU, „Widok Wsparcie” (sprawdzone 21.11.2026). Tylko podmioty charytatywne. */

export type Organization = { id: string; name: string; help: string; forWhom: string; url: string; free?: boolean };

export const ORGANIZATIONS: Record<string, Organization> = {
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

export type Situation = { id: string; title: string; categories: SupportSituation[]; formal: Formal[] };

const GOV_PARENTAL = { label: "gov.pl · Urlop rodzicielski", url: "https://www.gov.pl/web/rodzina/urlop-rodzicielski" };
const GOV_SUPPLEMENTARY = { label: "gov.pl · Uzupełniający urlop macierzyński", url: "https://www.gov.pl/web/rodzina/uzupelniajacy-urlop-macierzynski" };
const ASK_ZUSIK: Formal = { text: "O swoją sytuację możesz zapytać Zusika. W odpowiedzi pokaże przepis i źródło." };

export const SITUATIONS: Situation[] = [
  {
    id: "strata",
    title: "Strata dziecka lub poronienie",
    categories: ["strata-dziecka", "poronienie", "zaloba"],
    formal: [ASK_ZUSIK],
  },
  {
    id: "wczesniak",
    title: "Wcześniak",
    categories: ["wczesniak"],
    formal: [
      {
        text: "Uzupełniający urlop macierzyński: tydzień urlopu za każdy tydzień pobytu dziecka w szpitalu, do 15. tygodnia po porodzie (poród przed 28. tygodniem ciąży lub masa do 1000 g) albo do 8. tygodnia w pozostałych przypadkach.",
        source: GOV_SUPPLEMENTARY,
      },
    ],
  },
  {
    id: "za-zyciem",
    title: "Ciężka choroba dziecka („Za życiem”)",
    categories: ["ciezko-chore-dziecko"],
    formal: [{ text: "Z zaświadczeniem „Za życiem” urlop rodzicielski wynosi do 65 tygodni (do 67 przy porodzie mnogim).", source: GOV_PARENTAL }],
  },
  {
    id: "rodzic",
    title: "Trudna sytuacja rodzica",
    categories: ["prawa-w-ciazy-i-przy-porodzie"],
    formal: [ASK_ZUSIK],
  },
];
