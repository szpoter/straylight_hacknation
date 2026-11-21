import type { Citation, FormInfo } from "./contract";

/**
 * Official fragments for Kamil's case, copied verbatim on 21.11.2026.
 * Public ZUS material only: no private competition files, nothing indexed in Qdrant.
 */
export const CITATIONS: Record<string, Citation> = {
  "zam-info-okres": {
    id: "zam-info-okres",
    title: "ZUS, INFORMACJA do wniosku o zasiłek macierzyński (ZAM), część II",
    url: "https://www.zus.pl/documents/10182/4223950/ZAM_pobierz+i+drukuj.pdf/f1ad7e3f-0eaa-fdbc-20ec-5b07ab59566a#page=6",
    quote:
      "urlopu ojcowskiego – 2 tygodnie, niedłużej jednak niż do: — ukończenia przez dziecko 12 miesiąca życia – w przypadku, gdy ubezpieczonemu urodziło się dziecko […] Z zasiłku macierzyńskiego za okres urlopu ojcowskiego możesz skorzystać jednorazowo lub niewięcej niż w dwóch częściach, z których każda nie może być krótsza niż tydzień.",
    fetchedAt: "2026-11-21",
  },
  "zus-ojcowski-niepracownik": {
    id: "zus-ojcowski-niepracownik",
    title: "ZUS, Zasiłek macierzyński za okres odpowiadający okresowi urlopu ojcowskiego",
    url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/prawo-do-zasilku-i-okres-przyslugiwania/za-okres-dodatkowego-urlopu-ojcowskiego",
    quote:
      "Urlop ojcowski oraz zasiłek macierzyński za okres tego urlopu może zostać wykorzystany jednorazowo albo w nie więcej niż 2 częściach, z których kolejna nie musi przypadać bezpośrednio po poprzedniej części urlopu ojcowskiego. Żadna z części urlopu ojcowskiego nie może być krótsza niż tydzień. Zasady te mają także zastosowanie do ubezpieczonych niebędących pracownikami.",
    fetchedAt: "2026-11-21",
  },
  "zus-termin-niepracownik": {
    id: "zus-termin-niepracownik",
    title: "ZUS, Zasiłek macierzyński — niezbędne dokumenty, okres urlopu ojcowskiego",
    url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/niezbedne-dokumenty",
    quote:
      "Ubezpieczony niebędący pracownikiem w celu uzyskania zasiłku macierzyńskiego za okres odpowiadający okresowi urlopu ojcowskiego powinien złożyć wniosek o wypłatę zasiłku macierzyńskiego za ten okres przed terminem rozpoczęcia korzystania z zasiłku macierzyńskiego, zawierający datę, od której ubezpieczony zamierza korzystać z zasiłku macierzyńskiego.",
    fetchedAt: "2026-11-21",
  },
  "zam-info-prawo": {
    id: "zam-info-prawo",
    title: "ZUS, INFORMACJA do wniosku o zasiłek macierzyński (ZAM), część I",
    url: "https://www.zus.pl/documents/10182/4223950/ZAM_pobierz+i+drukuj.pdf/f1ad7e3f-0eaa-fdbc-20ec-5b07ab59566a#page=6",
    quote:
      "Zasiłek macierzyński przysługuje Ci, jeżeli w okresie ubezpieczenia chorobowego lub urlopu wychowawczego: urodziłaś/urodziło Ci się dziecko (lub dzieci)",
    fetchedAt: "2026-11-21",
  },
};

/**
 * ZAM "pobierz i drukuj" from https://www.zus.pl/-/wniosek-zas-54-1 ("Aktualizacja formularza:
 * 24 października 2026 r.", Last-Modified 23.10.2026, 7 pages: 5 of form + 2 of INFORMACJA).
 * The field map in lib/forms/zam-map.ts is valid only for this exact file.
 */
export const ZAM_FORM: FormInfo = {
  symbol: "ZAM",
  version: "2026-10-24",
  sha256: "45597ebb0278edf7518e24cf8eb764f242661638c7d1288ab0b6edf70186c639",
  sourceUrl:
    "https://www.zus.pl/documents/10182/4223950/ZAM_pobierz+i+drukuj.pdf/f1ad7e3f-0eaa-fdbc-20ec-5b07ab59566a?t=1792761767460",
  templatePath: "/forms/zam-2026-10-24.pdf",
};
