// Treść i układ kafli sekcji „Jak możecie podzielić się opieką?” (#liczby).
// TU podmieniasz treść, liczbę kafli (najwyżej 8, MAX_TILES w liquid-renderer.ts) i kolory.
// Liczby i źródła według SPEC.md („Pod filmem — urlop rodzicielski w liczbach”), piąty kafel
// (urlop ojcowski) według gov.pl. Treść jest robocza: później dojdą wykresy i dopracowany tekst.

/** Kolory tylko z tokenów DESIGN.md (zmienne --color-* z globals.css). */
export type TileColor = "primary" | "secondary" | "tertiary" | "on-surface" | "on-surface-variant";
/** Kolor tekstu na kaflu: on-primary (biały) na ciemnych, on-surface (granat) na jasnych. */
export type TileInk = "on-primary" | "on-surface";

export type BentoTile = {
  id: string;
  color: TileColor;
  ink: TileInk;
  /** Duża liczba na kaflu. */
  value: string;
  /** Podpis pod liczbą. */
  label: string;
  /** Duży kafel (większa liczba). */
  large?: boolean;
  /**
   * Miejsce w siatce od 768 px: 4 kolumny × 2 rzędy (wartości CSS grid-column / grid-row).
   * Na telefonie siatka ma 2 kolumny, a kafel z `wide` zajmuje obie.
   */
  column: string;
  row: string;
  wide?: boolean;
  /** Sąsiad (id), do którego kafel wypuszcza płynny mostek po najechaniu kursorem. */
  bridgeTo: string;
  /** Okno ze szczegółami po kliknięciu. */
  details: { title: string; body: string; source: { label: string; href: string } };
};

const PARENTAL_LEAVE = "https://www.gov.pl/web/rodzina/urlop-rodzicielski";

export const BENTO_TILES: BentoTile[] = [
  {
    id: "zasilek",
    color: "on-surface",
    ink: "on-primary",
    value: "340,3 tys.",
    label: "osób pobierało w 2025 r. zasiłek za okres urlopu rodzicielskiego",
    large: true,
    column: "1 / 3",
    row: "1 / 3",
    wide: true,
    bridgeTo: "wymiar",
    details: {
      title: "Tylu rodziców korzysta z urlopu rodzicielskiego",
      body: "Tyle osób w Polsce pobierało w 2025 r. zasiłek macierzyński za okres urlopu rodzicielskiego. To wstępne dane ZUS za cały rok.",
      source: {
        label: "Dane ZUS za I–XII 2025, tablica 8",
        href: "https://www.zus.pl/documents/10182/167606/wst%C4%99pna_12_2025.pdf/5fd743fb-5d5a-c6f4-bf7d-468fdac1fca7#page=9",
      },
    },
  },
  {
    id: "wymiar",
    color: "secondary",
    ink: "on-surface",
    value: "do 41 tygodni",
    label: "urlopu rodzicielskiego dla obojga rodziców",
    column: "3 / 4",
    row: "1 / 2",
    bridgeTo: "podzial",
    details: {
      title: "Ile trwa urlop rodzicielski",
      body: "Tyle urlopu rodzicielskiego mają standardowo do dyspozycji łącznie uprawnieni rodzice po urodzeniu jednego dziecka przy jednym porodzie.",
      source: { label: "Wymiar urlopu rodzicielskiego (gov.pl)", href: PARENTAL_LEAVE },
    },
  },
  {
    id: "czesc",
    color: "primary",
    ink: "on-primary",
    value: "po 9 tygodni",
    label: "dla każdego z rodziców, tylko dla niego",
    column: "4 / 5",
    row: "1 / 2",
    bridgeTo: "wymiar",
    details: {
      title: "Część, której nie można oddać",
      body: "Z puli urlopu rodzicielskiego każde z uprawnionych rodziców ma własną część. Może ją wykorzystać tylko ten rodzic, nie przechodzi ona na drugiego.",
      source: { label: "Część nieprzenoszalna (gov.pl)", href: PARENTAL_LEAVE },
    },
  },
  {
    id: "podzial",
    color: "tertiary",
    ink: "on-surface",
    value: "do 5 części",
    label: "na tyle okresów możecie rozłożyć urlop",
    column: "3 / 4",
    row: "2 / 3",
    bridgeTo: "ojcowski",
    details: {
      title: "Urlop w kawałkach",
      body: "Urlop rodzicielski możecie rozłożyć na najwyżej 5 części. W planie zobaczycie je na jednej osi czasu.",
      source: { label: "Zasady podziału urlopu (gov.pl)", href: PARENTAL_LEAVE },
    },
  },
  {
    id: "ojcowski",
    color: "on-surface-variant",
    ink: "on-primary",
    value: "2 tygodnie",
    label: "urlopu ojcowskiego do 12. miesiąca życia dziecka",
    column: "4 / 5",
    row: "2 / 3",
    bridgeTo: "czesc",
    details: {
      title: "Urlop ojcowski",
      body: "Ojciec dziecka może wziąć do 2 tygodni urlopu ojcowskiego, w całości albo w dwóch częściach po tygodniu, do ukończenia przez dziecko 12 miesięcy.",
      source: { label: "Urlop ojcowski (gov.pl)", href: "https://www.gov.pl/web/rodzina/urlop-ojcowski" },
    },
  },
];
