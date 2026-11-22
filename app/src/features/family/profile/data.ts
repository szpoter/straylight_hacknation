/** Dane fikcyjne profilu i sprawy testowej. TODO(backend): symulacja eZUS i OCR z API. */
import type { ProfileRow } from "@/lib/demo/types";

export const ZUS_FETCHED_AT = "21 listopada 2026";

export const ZUS_ACCOUNT: Array<{ title: string; rows: ProfileRow[] }> = [
  {
    title: "Ubezpieczenia",
    rows: [
      { label: "Tytuł ubezpieczenia", value: "Umowa o pracę · od 1 marca 2021", source: "zus", editable: false },
      { label: "Ubezpieczenie chorobowe", value: "Obowiązkowe · bez przerw", source: "zus", editable: false },
      { label: "Płatnik", value: "Kwiatek sp. z o.o. · do 20 ubezpieczonych", source: "zus", editable: false },
    ],
  },
  {
    title: "Podstawy składek",
    rows: [
      { label: "Średnia z 12 miesięcy", value: "7 894,20 zł brutto", source: "zus", editable: false },
      { label: "Szacowana podstawa zasiłku", value: "6 812,40 zł · szacunek", source: "zus", editable: false },
    ],
  },
  {
    title: "Rodzina i świadczenia",
    rows: [
      { label: "Zgłoszeni do ubezpieczenia zdrowotnego", value: "Brak członków rodziny", source: "zus", editable: false },
      { label: "e-ZLA", value: "1 zwolnienie lekarskie w ciąży · 12 sierpnia – 30 września 2026", source: "zus", editable: false },
      { label: "Przyznane świadczenia", value: "Zasiłek chorobowy w ciąży · wypłacony", source: "zus", editable: false },
      { label: "Zadłużenie składkowe", value: "Brak", source: "zus", editable: false },
    ],
  },
];

export type ReadField = { id: string; label: string; value: string; source: string; missing?: boolean; edited?: boolean };

/** Pola odczytane z wgranego PDF (fikcyjna sprawa „Alicja T.”). */
export const TEST_FIELDS: ReadField[] = [
  { id: "osoba", label: "Ubezpieczona", value: "Alicja T.", source: "ZAM, s. 1" },
  { id: "tytul", label: "Tytuł ubezpieczenia", value: "Umowa o pracę", source: "Z-3, s. 1" },
  { id: "podstawa", label: "Podstawa", value: "6 812,40 zł", source: "Z-3, s. 4" },
  { id: "porod", label: "Data porodu", value: "10.11.2026", source: "Odpis aktu urodzenia, s. 1" },
  { id: "dzieci", label: "Liczba dzieci z porodu", value: "1", source: "Odpis aktu urodzenia, s. 1" },
  { id: "wyplata", label: "Sposób wypłaty", value: "", source: "ZAM, s. 2", missing: true },
];
