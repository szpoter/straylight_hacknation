/**
 * Charitable organisations that support parents in difficult situations (ZUS task p. 13 point i,
 * p. 14: "pozyskania informacji o podmiotach udzielających wsparcia"; SPEC-PANEL §5).
 * Only foundations and associations. Every description, contact and "free of charge" note is taken
 * from the organisation's own website on the verification day; nothing is inferred. Re-check entries
 * older than six months (the admin panel flags them).
 */

export type SupportSituation =
  | "strata-dziecka"
  | "poronienie"
  | "wczesniak"
  | "ciezko-chore-dziecko"
  | "zaloba"
  | "prawa-w-ciazy-i-przy-porodzie";

export const SITUATION_LABEL: Record<SupportSituation, string> = {
  "strata-dziecka": "Strata dziecka",
  poronienie: "Poronienie i martwe urodzenie",
  wczesniak: "Przedwczesny poród, wcześniak",
  "ciezko-chore-dziecko": "Ciężko chore dziecko",
  zaloba: "Żałoba",
  "prawa-w-ciazy-i-przy-porodzie": "Prawa w ciąży i przy porodzie",
};

export interface SupportOrganization {
  id: string;
  name: string;
  legalForm: "fundacja" | "stowarzyszenie";
  krs: string;
  /** Who it helps, in the organisation's own terms. */
  helps: string;
  situations: SupportSituation[];
  /** Only what the site states as free; null when it does not say. */
  freeOfCharge: string | null;
  phone: string | null;
  email: string | null;
  url: string;
  /** Area served, only when the site states it. */
  area: string | null;
  verifiedAt: string;
}

export const SUPPORT_ORGANIZATIONS: SupportOrganization[] = [
  {
    id: "fundacja-ernesta",
    name: "Fundacja Ernesta (Fundacja Medycyny Prenatalnej im. Ernesta Wójcickiego)",
    legalForm: "fundacja",
    krs: "0000789473",
    helps: "Pomoc psychologiczna, prawna i diagnostyczna w trudnych sytuacjach okołoporodowych, m.in. po poronieniu i martwym urodzeniu.",
    situations: ["poronienie", "strata-dziecka"],
    freeOfCharge: "Bezpłatna diagnostyka dla kobiet w trudnych sytuacjach okołoporodowych.",
    phone: "22 350 00 50",
    email: "biuro@fundacjaernesta.pl",
    url: "https://fundacjaernesta.pl/jak-pomagamy/",
    area: null,
    verifiedAt: "2026-11-22",
  },
  {
    id: "fundacja-wczesniak",
    name: "Fundacja Wcześniak Rodzice-Rodzicom",
    legalForm: "fundacja",
    krs: "0000191989",
    helps: "Pomoc wcześniakom i ich rodzicom.",
    situations: ["wczesniak"],
    freeOfCharge: "Bezpłatne wypożyczenie sprzętu do pielęgnacji wcześniaków.",
    phone: "22 121 80 55",
    email: "wczesniak@wczesniak.pl",
    url: "https://wczesniak.pl/",
    area: null,
    verifiedAt: "2026-11-22",
  },
  {
    id: "warszawskie-hospicjum-dla-dzieci",
    name: "Fundacja Warszawskie Hospicjum dla Dzieci",
    legalForm: "fundacja",
    krs: "0000097123",
    helps:
      "Hospicjum perinatalne dla rodziców oczekujących dziecka z wadą letalną lub nieuleczalną chorobą, hospicjum domowe dla nieuleczalnie chorych dzieci i wsparcie w żałobie, także gdy dziecko umiera przed narodzinami.",
    situations: ["ciezko-chore-dziecko", "strata-dziecka", "zaloba"],
    freeOfCharge: null,
    phone: "509 797 324",
    email: "poczta@hospicjum.waw.pl",
    url: "https://www.hospicjum.waw.pl/",
    area: "Warszawa",
    verifiedAt: "2026-11-22",
  },
  {
    id: "fundacja-gajusz",
    name: "Fundacja Gajusz",
    legalForm: "fundacja",
    krs: "0000109866",
    helps: "Pomoc dzieciom chorym, opuszczonym i po traumie. Fundacja prowadzi hospicjum.",
    situations: ["ciezko-chore-dziecko"],
    freeOfCharge: null,
    phone: "42 631 00 41",
    email: null,
    url: "https://gajusz.org.pl/",
    area: "Łódź",
    verifiedAt: "2026-11-22",
  },
  {
    id: "fundacja-nagle-sami",
    name: "Fundacja Nagle Sami",
    legalForm: "fundacja",
    krs: "0000398530",
    helps: "Pomoc osobom w żałobie i w kryzysie po nagłej śmierci bliskiej osoby: konsultacje, terapia, grupy wsparcia dla dzieci, młodzieży, dorosłych i rodzin.",
    situations: ["zaloba", "strata-dziecka"],
    freeOfCharge: "Bezpłatny Telefon Wsparcia 800 108 108, poniedziałek–piątek 14:00–20:00.",
    phone: "800 108 108",
    email: "info@naglesami.org.pl",
    url: "https://naglesami.org.pl/",
    area: "Warszawa i online",
    verifiedAt: "2026-11-22",
  },
  {
    id: "fundacja-rodzic-po-ludzku",
    name: "Fundacja Rodzić po Ludzku",
    legalForm: "fundacja",
    krs: "0000150773",
    helps: "Kobiety w ciąży, przy porodzie i w połogu: porady prawne i zgłaszanie naruszeń praw pacjentki.",
    situations: ["prawa-w-ciazy-i-przy-porodzie"],
    freeOfCharge: null,
    phone: null,
    email: null,
    url: "https://rodzicpoludzku.pl/",
    area: null,
    verifiedAt: "2026-11-22",
  },
];

/** SPEC-PANEL §5 [P]: entries not verified for six months need a new check. */
export const STALE_AFTER_DAYS = 183;

export function isStale(verifiedAt: string, today: string): boolean {
  const days = (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${verifiedAt}T00:00:00Z`)) / 86_400_000;
  return days > STALE_AFTER_DAYS;
}

export function organizationsFor(situation: SupportSituation): SupportOrganization[] {
  return SUPPORT_ORGANIZATIONS.filter((o) => o.situations.includes(situation));
}
