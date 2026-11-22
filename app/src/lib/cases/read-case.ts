import type { EligibilityFacts, EligibilityStatus } from "@/lib/rules/maternity-eligibility";

/**
 * Podpowiedzi faktów z tekstu skanów sprawy (OCR w przeglądarce, `features/check/read-pdf.ts`).
 * Czysta funkcja na tekście stron. Każda podpowiedź ma stronę i fragment, z którego pochodzi —
 * użytkownik potwierdza ją albo poprawia w formularzu, a werdykt i tak liczy reguła.
 *
 * Wzorce pochodzą z druków i pism w zestawie ZUS: decyzje („odmówić prawa…”, „nie podlega…
 * obowiązkowo ubezpieczeniom”), odpowiedź na wniosek o poświadczenie ubezpieczenia chorobowego
 * (kody tytułu, „zadłużenie… TAK”, „Zaległość została uregulowana… w dniu”, „brak zgłoszenia do
 * dobrowolnego ubezpieczenia chorobowego”), Z-3 / Z-3a / Z-3b, ZAS-26, świadectwo pracy, odpis
 * aktu urodzenia. Pola wyboru drukarskie (np. „przyjęciem na wychowanie…” na każdym ZAM) celowo
 * pomijamy. Skany odręczne i tabele OCR czyta słabo, dlatego nic nie jest przyjmowane bez
 * potwierdzenia.
 */

export type FactField =
  | "applicant"
  | "event"
  | "eventDate"
  | "periodStart"
  | "childBirthDate"
  | "title"
  | "insured"
  | "notSubjectDecision"
  | "employmentEnd"
  | "arrears"
  | "arrearsPaidOn";

export interface Evidence {
  field: FactField | "zus";
  /** Co podpowiadamy, po polsku, do listy pod formularzem. */
  label: string;
  page: number;
  snippet: string;
}

export interface CaseReading {
  facts: Partial<EligibilityFacts>;
  evidence: Evidence[];
  /** Wynik ZUS, jeśli w aktach jest decyzja albo notatka o rozstrzygnięciu. */
  zusOutcome: Exclude<EligibilityStatus, "brak-danych" | "wstrzymany"> | null;
}

const DATE = String.raw`(\d{1,2})[.\-/ ](\d{1,2})[.\-/ ](\d{4})|(\d{4})-(\d{2})-(\d{2})`;

/** dd.mm.rrrr, dd-mm-rrrr albo rrrr-mm-dd → ISO; null, gdy to nie jest data kalendarzowa. */
export function isoFromMatch(m: RegExpMatchArray | RegExpExecArray, offset = 1): string | null {
  const [d, mo, y, y2, mo2, d2] = m.slice(offset, offset + 6);
  const year = Number(y ?? y2);
  const month = Number(mo ?? mo2);
  const dayNum = Number(d ?? d2);
  if (!year || month < 1 || month > 12 || dayNum < 1 || dayNum > 31) return null;
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
  const check = new Date(`${iso}T00:00:00Z`);
  return check.toISOString().slice(0, 10) === iso ? iso : null;
}

const pl = (iso: string) => iso.split("-").reverse().join(".");

function normalize(text: string): string {
  return text.normalize("NFC").replace(/[ \t]+/g, " ");
}

function snippetAround(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + length + 60);
  return (start > 0 ? "…" : "") + text.slice(start, end).replace(/\s+/g, " ").trim() + (end < text.length ? "…" : "");
}

/** Maskuje 11-cyfrowe ciągi (PESEL) w fragmentach pokazywanych użytkownikowi. */
export function maskIds(text: string): string {
  return text.replace(/\b\d{11}\b/g, "•••••••••••");
}

// Kody tytułu z poświadczenia ubezpieczenia są najpewniejsze, potem opisy z decyzji, na końcu rodzaj druku Z-3.
const TITLES: Array<[RegExp, EligibilityFacts["title"], string]> = [
  [/\b0511\b/, "wspolpracujacy", "osoba współpracująca przy działalności (kod 0511)"],
  [/\b0570\b/, "dzialalnosc", "działalność gospodarcza (kod 0570)"],
  [/\b0411\b/, "zleceniobiorca", "umowa zlecenia (kod 0411)"],
  [/\b0110\b/, "pracownik", "umowa o pracę (kod 0110)"],
  [/z tytu[łl]u prowadzenia pozarolniczej dzia[łl]alno|jako osoba prowadz[ąa]ca pozarolnicz/i, "dzialalnosc", "działalność gospodarcza"],
  [/z tytu[łl]u umowy zlecenia/i, "zleceniobiorca", "umowa zlecenia"],
  [/jako pracownik|Informacje o pracowniku|[ŚS]wiadectwo pracy/i, "pracownik", "umowa o pracę"],
  [/\bZ-3a\b/, "zleceniobiorca", "zaświadczenie Z-3a (zleceniobiorcy)"],
  [/\bZ-3b\b|je[żz]eli prowadzisz pozarolnicz/i, "dzialalnosc", "zaświadczenie Z-3b (działalność)"],
];

export function readCaseText(pages: string[]): CaseReading {
  const facts: Partial<EligibilityFacts> = { event: "porod" };
  const evidence: Evidence[] = [];
  let zusOutcome: CaseReading["zusOutcome"] = null;
  const texts = pages.map(normalize);

  type Hit = { page: number; text: string; match: RegExpExecArray };
  const first = (re: RegExp): Hit | null => {
    for (let i = 0; i < texts.length; i++) {
      const match = new RegExp(re.source, re.flags.replace("g", "")).exec(texts[i]);
      if (match) return { page: i + 1, text: texts[i], match };
    }
    return null;
  };
  const found = (field: Evidence["field"], label: string, hit: Hit) =>
    evidence.push({ field, label, page: hit.page, snippet: maskIds(snippetAround(hit.text, hit.match.index, hit.match[0].length)) });
  const dateHit = (re: RegExp) => {
    const hit = first(re);
    const iso = hit ? isoFromMatch(hit.match) : null;
    return hit && iso ? { hit, iso } : null;
  };

  // Rozstrzygnięcie ZUS.
  const refusal = first(/odm[óo]wi[ćc] prawa|odm[óo]wiono prawa|odmawiaj[ąa]c\w* prawa|zako[ńn]czona odmow[ąa]|decyzj\w* odmown|decyzja odmawiaj/i);
  const grant = first(/przyznano prawo|wyp[łl]acono [śs]wiadczenie|ustalono uprawnienia|zosta[łl]a dokonana wyp[łl]ata/i);
  if (refusal) {
    zusOutcome = "nie-przysluguje";
    found("zus", "W aktach jest odmowa prawa do zasiłku", refusal);
  } else if (grant) {
    zusOutcome = "przysluguje";
    found("zus", "W aktach jest przyznanie albo wypłata zasiłku", grant);
  }

  // Zdarzenie: pola wyboru z druków ZAM i Z-3 pomijamy, liczy się oświadczenie albo opis sprawy.
  const foster = first(/niezawodow\w* rodzin\w* zast[ęe]pcz/i);
  const adoption = first(/O[śs]wiadczenie\s+o przyj[ęe]ciu na wychowanie|z tytu[łl]u przyj[ęe]cia dziecka na wychowanie|przyj[ąa][łl]\w* na wychowanie dziec/i);
  if (foster) {
    facts.event = "rodzina-zastepcza";
    found("event", "Przyjęcie dziecka do niezawodowej rodziny zastępczej", foster);
  } else if (adoption) {
    facts.event = "przysposobienie";
    found("event", "Przyjęcie dziecka na wychowanie (przysposobienie)", adoption);
    const court = first(/wyst[ąa]pi[łl]\w* do s[ąa]du/i);
    if (court) {
      facts.courtFiled = "tak";
      found("event", "Wystąpiono do sądu o przysposobienie", court);
    }
  }

  const second = first(/za okres urlopu ojcowskiego od|pracownikowi[\s–-]+ojcu|\bma Pan\b|na Pana koncie/i);
  if (second) {
    facts.applicant = "drugi-rodzic";
    found("applicant", "Wniosek drugiego rodzica (ojca)", second);
  }

  // Daty: urodzenie dziecka (odpis, decyzja), przyjęcie na wychowanie, początek okresu.
  const birth = dateHit(new RegExp(String.raw`Data ?urodze\S*\s*(?:${DATE})`, "i")) ?? dateHit(new RegExp(String.raw`urodzi[łl]\w* dziecko w dniu\s*(?:${DATE})`, "i"));
  if (birth) {
    if (facts.event === "porod") facts.eventDate = birth.iso;
    else facts.childBirthDate = birth.iso;
    found(facts.event === "porod" ? "eventDate" : "childBirthDate", `Data urodzenia dziecka: ${pl(birth.iso)}`, birth.hit);
  }
  if (facts.event !== "porod") {
    const taken = dateHit(new RegExp(String.raw`przyj[ąa][łl]\w* na wychowanie[\s\S]{0,60}?(?:${DATE})`, "i"));
    if (taken) {
      facts.eventDate = taken.iso;
      found("eventDate", `Data przyjęcia na wychowanie: ${pl(taken.iso)}`, taken.hit);
    }
  }
  const period = dateHit(new RegExp(String.raw`(?:prawa do zasi[łl]ku[^\n]{0,80}?|za okres[^\n]{0,60}?)od (?:dnia )?(?:${DATE})`, "i"));
  if (period && period.iso !== facts.eventDate) {
    facts.periodStart = period.iso;
    found("periodStart", `Okres z wniosku albo decyzji od ${pl(period.iso)}`, period.hit);
  }

  // Tytuł ubezpieczenia.
  for (const [re, title, label] of TITLES) {
    const hit = first(re);
    if (hit) {
      facts.title = title;
      found("title", `Tytuł ubezpieczenia: ${label}`, hit);
      break;
    }
  }

  // Ubezpieczenie: decyzja o niepodleganiu, brak zgłoszenia.
  const notSubject = first(/nie podlega\w* (?:\S+ ){0,2}obowi[ąa]zkowo ubezpiecz/i);
  if (notSubject) {
    facts.notSubjectDecision = true;
    facts.insured = "nie";
    found("notSubjectDecision", "Decyzja ZUS: nie podlega obowiązkowo ubezpieczeniom", notSubject);
  }
  const notRegistered = first(/brak zg[łl]oszenia do dobrowolnego ubezpieczenia chorobowego|nie zg[łl]osi[łl]\w*[^\n]{0,40}do (?:dobrowolnego )?ubezpiecze|nie podlega[łl]\w* (?:\S+ ){0,1}ubezpieczeniu chorobowemu/i);
  if (notRegistered) {
    facts.insured = "nie";
    found("insured", "Brak ubezpieczenia chorobowego (brak zgłoszenia)", notRegistered);
  }

  // Koniec zatrudnienia w ciąży.
  const liquidation = first(/likwidacj\w* (?:zak[łl]adu pracy|pracodawcy)|upad[łl]o[śs]ci\w* pracodawcy|og[łl]oszeni\w* upad[łl]o/i);
  if (liquidation) {
    facts.employmentEnd = "upadlosc-likwidacja";
    found("employmentEnd", "Koniec umowy przez upadłość albo likwidację pracodawcy", liquidation);
  }
  const extended = first(/zatrudnion\w* do dnia porodu|przed[łl]u[żz]on\w* do dnia porodu/i);
  if (extended) {
    facts.employmentEnd = "przedluzona-do-porodu";
    facts.insured = "tak";
    found("employmentEnd", "Umowa przedłużona do dnia porodu", extended);
  }

  // Zadłużenie składkowe (poświadczenie ubezpieczenia, decyzja z art. 2a). OCR myli „z” z „x”.
  const debt = first(/zad[łl]u[żz]enie \S tytu[łl]u sk[łl]adek[\s\S]{0,160}?:\s*TAK\b|zad[łl]u[żz]eni\w* \S tytu[łl]u sk[łl]adek[\s\S]{0,80}?na kwot[ęe] przekraczaj/i);
  const debtNo = first(/zad[łl]u[żz]enie \S tytu[łl]u sk[łl]adek[\s\S]{0,160}?:\s*NIE\b/i);
  if (debt) {
    facts.arrears = "powyzej-progu";
    found("arrears", "Zadłużenie składkowe w dniu powstania prawa", debt);
  } else if (debtNo) {
    facts.arrears = "brak";
    found("arrears", "Brak zadłużenia składkowego", debtNo);
  }
  const paid = dateHit(new RegExp(String.raw`uregulowana w ca[łl]o[śs]ci w dniu\s*(?:${DATE})`, "i"));
  if (paid) {
    facts.arrearsPaidOn = paid.iso;
    found("arrearsPaidOn", `Zadłużenie spłacono ${pl(paid.iso)}`, paid.hit);
  }

  return { facts, evidence, zusOutcome };
}
