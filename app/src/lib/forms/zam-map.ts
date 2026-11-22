import type { FieldKey, KamilView } from "../kamil/contract";
import { formatShort } from "../rules/dates";

/**
 * Field map of ZAM "pobierz i drukuj", version 2026-10-24 (sha256 45597ebb…c639).
 * Coordinates are PDF points, origin bottom-left, measured from the vector lines of the template.
 * A different template checksum stops the export: the map has to be checked again first.
 */
export const ZAM_TEMPLATE_SHA256 = "45597ebb0278edf7518e24cf8eb764f242661638c7d1288ab0b6edf70186c639";

export const ZAM_CELL = 17.86;
export const ZAM_ROW_HEIGHT = 17.4;

/** A row of character cells: one character per cell. */
export interface CellsSlot {
  type: "cells";
  page: number;
  x: number;
  y: number;
  count: number;
}
/** A free-text box. Multi-line when `lines` > 1. */
export interface TextSlot {
  type: "text";
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
  lines?: number;
  align?: "left" | "center";
}
/** A checkbox, marked with "X". */
export interface CheckSlot {
  type: "check";
  page: number;
  x: number;
  y: number;
}
export type Slot = CellsSlot | TextSlot | CheckSlot;

export const ZAM_MAP = {
  // Strona 1 · Twoje dane
  father_pesel: { type: "cells", page: 1, x: 239.0, y: 536, count: 11 },
  applicant_birth: { type: "cells", page: 1, x: 239, y: 508.8, count: 8 },
  applicant_document: { type: "text", page: 1, x: 239, y: 464, w: 313.6, h: 26.8 },
  father_first_name: { type: "text", page: 1, x: 239.0, y: 428, w: 313.6, h: 17.4 },
  father_last_name: { type: "text", page: 1, x: 239.0, y: 402, w: 313.6, h: 17.4 },
  father_street: { type: "text", page: 1, x: 239.0, y: 375, w: 313.6, h: 17.4 },
  father_house: { type: "text", page: 1, x: 239.0, y: 348, w: 71.5, h: 17.4 },
  father_flat: { type: "text", page: 1, x: 399.7, y: 348, w: 71.5, h: 17.4 },
  father_postcode: { type: "text", page: 1, x: 239.0, y: 321, w: 71.5, h: 17.4 },
  father_city: { type: "text", page: 1, x: 399.7, y: 321, w: 152.9, h: 17.4 },
  applicant_country: { type: "text", page: 1, x: 239, y: 294.2, w: 313.6, h: 17.4 },
  // Strona 1 · Dane płatnika składek (REGON and PESEL only when there is no NIP)
  payer_nip: { type: "cells", page: 1, x: 239.0, y: 194, count: 10 },
  payer_name: { type: "text", page: 1, x: 239.0, y: 60, w: 313.6, h: 17.4 },
  // Strona 2 · Rachunek bankowy
  bank_account: { type: "cells", page: 2, x: 42.8, y: 710, count: 26 },
  // Strona 2 · Zakres wniosku
  maternity_check: { type: "check", page: 2, x: 42.8, y: 616.5 },
  maternity_period: { type: "text", page: 2, x: 275, y: 589.8, w: 277.6, h: 44.3 },
  maternity_end: { type: "cells", page: 2, x: 399.9, y: 339.5, count: 8 },
  full_leave_intent: { type: "check", page: 2, x: 42.8, y: 303.3 },
  paternity_check: { type: "check", page: 2, x: 42.8, y: 420 },
  paternity_period: { type: "text", page: 2, x: 185.6, y: 402, w: 367.2, h: 36 },
  paternity_part: { type: "text", page: 2, x: 221.3, y: 366, w: 35.8, h: 17.4, align: "center" },
  // Strona 2 · Informacje o ubezpieczeniu (działalność): TAK / NIE
  insurance_yes: { type: "check", page: 2, x: 42.8, y: 207 },
  insurance_no: { type: "check", page: 2, x: 96.3, y: 207 },
  // Strona 2 · w związku z: 1. urodzeniem dziecka
  reason_birth: { type: "check", page: 2, x: 60.4, y: 150 },
  // Strona 3 · Dane dziecka
  child_data: { type: "text", page: 3, x: 60.4, y: 669, w: 491.9, h: 60, lines: 4 },
  certificate_check: { type: "check", page: 3, x: 60.4, y: 636.6 },
  certificate_names: { type: "text", page: 3, x: 221.4, y: 636.6, w: 331, h: 17.4 },
  // Strona 5 · Oświadczenie (urlop ojcowski z innego tytułu): TAK / NIE
  other_title_yes: { type: "check", page: 5, x: 42.8, y: 608 },
  other_title_no: { type: "check", page: 5, x: 96.3, y: 608 },
  // Strona 5 · Dane drugiego rodzica
  mother_pesel: { type: "cells", page: 5, x: 239.0, y: 387, count: 11 },
  second_parent_birth: { type: "cells", page: 5, x: 239, y: 360, count: 8 },
  second_parent_document: { type: "text", page: 5, x: 239, y: 315, w: 313.6, h: 26.8 },
  mother_first_name: { type: "text", page: 5, x: 239.0, y: 280, w: 313.6, h: 17.4 },
  mother_last_name: { type: "text", page: 5, x: 239.0, y: 253, w: 313.6, h: 17.4 },
  // Strona 5 · Data (ddmmrrrr); the signature stays empty for Kamil's hand
  sign_date: { type: "cells", page: 5, x: 78.2, y: 184, count: 8 },
} as const satisfies Record<string, Slot>;

export type ZamSlot = keyof typeof ZAM_MAP;

/** Values ready for the form, keyed by slot. Checkboxes are present only when ticked. */
export type ZamValues = Partial<Record<ZamSlot, string>>;

export interface ZamBuild {
  values: ZamValues;
  /** Facts still needed before the form can be exported. */
  missing: FieldKey[];
  /** The rule has computed an eligible period with its part number. */
  periodReady: boolean;
}

/** Facts required for Kamil's ZAM. */
export const ZAM_REQUIRED: FieldKey[] = [
  "father_pesel",
  "father_first_name",
  "father_last_name",
  "father_street",
  "father_house",
  "father_postcode",
  "father_city",
  "payer_nip",
  "payer_name",
  "child_first_name",
  "child_last_name",
  "child_birth_date",
  "child_birth_place",
  "mother_first_name",
  "mother_last_name",
  "mother_pesel",
  "insurance_confirmed",
  "other_title_paternity",
];

const upper = (v: string) => v.toLocaleUpperCase("pl-PL");
const digits = (v: string) => v.replace(/\D/g, "");

/** Confirmed facts + computed period → ZAM values. Only confirmed facts reach the form. */
export function buildZamValues(view: Pick<KamilView, "facts" | "result">, signDate: string): ZamBuild {
  const fact = (key: FieldKey) => view.facts[key]?.value ?? null;
  const missing = ZAM_REQUIRED.filter((key) => !fact(key));
  const values: ZamValues = {};
  const put = (slot: ZamSlot, key: FieldKey, transform: (v: string) => string = upper) => {
    const value = fact(key);
    if (value) values[slot] = transform(value);
  };
  put("father_pesel", "father_pesel", digits);
  put("father_first_name", "father_first_name");
  put("father_last_name", "father_last_name");
  put("father_street", "father_street");
  put("father_house", "father_house");
  put("father_flat", "father_flat");
  put("father_postcode", "father_postcode");
  put("father_city", "father_city");
  put("payer_nip", "payer_nip", digits);
  put("payer_name", "payer_name");
  put("bank_account", "bank_account", digits);
  put("mother_pesel", "mother_pesel", digits);
  put("mother_first_name", "mother_first_name");
  put("mother_last_name", "mother_last_name");

  const { period, partNumber, status } = view.result;
  const periodReady = status === "eligible" && !!period && !!partNumber;
  if (periodReady && period) {
    values.paternity_check = "X";
    values.paternity_period = `${formatShort(period.start)} – ${formatShort(period.end)}`;
    values.paternity_part = String(partNumber);
  }
  const insurance = fact("insurance_confirmed");
  if (insurance === "tak") values.insurance_yes = "X";
  if (insurance === "nie") values.insurance_no = "X";
  const other = fact("other_title_paternity");
  if (other === "tak") values.other_title_yes = "X";
  if (other === "nie") values.other_title_no = "X";

  const childName = [fact("child_first_name"), fact("child_last_name")].filter(Boolean).join(" ");
  const birthDate = fact("child_birth_date");
  if (childName || birthDate) {
    values.reason_birth = "X";
    values.child_data = upper(
      [
        childName,
        birthDate ? `DATA URODZENIA: ${formatShort(birthDate)}` : null,
        fact("child_birth_place") ? `MIEJSCE URODZENIA: ${fact("child_birth_place")}` : null,
        fact("child_pesel") ? `PESEL: ${fact("child_pesel")}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }
  values.sign_date = digits(formatShort(signDate));
  return { values, missing, periodReady };
}
