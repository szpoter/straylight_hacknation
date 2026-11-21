import { makeNip, makeNrb, makePesel, makeRegon } from "../ocr/identifiers";
import type { FieldKey } from "./contract";

/**
 * Fictional demo profile from TECH-SPEC-AGENT.md, scenario 2. Every person, number and address here
 * is invented; identifiers only have valid checksums. Nothing comes from the competition files.
 */
export const KAMIL_PROFILE_SOURCE = "Profil demonstracyjny Kamila (fikcyjny)";

const nip = makeNip("677123456") ?? makeNip("677123457") ?? "6771234560";

export const KAMIL_PROFILE: Partial<Record<FieldKey, string>> = {
  father_pesel: makePesel("1990-03-14", 123, true),
  father_first_name: "KAMIL",
  father_last_name: "WRONA",
  father_street: "JAŚMINOWA",
  father_house: "12",
  father_flat: "4",
  father_postcode: "31-542",
  father_city: "KRAKÓW",
  payer_nip: nip,
  payer_regon: makeRegon("36123456"),
  payer_name: "KAMIL WRONA PRACOWNIA STOLARSKA",
  bank_account: makeNrb("102028920000560201790001"),
  mother_pesel: makePesel("1992-08-02", 789, false),
  insurance_confirmed: "tak",
  no_arrears: "tak",
};

/** What the birth certificate says. The demo document is generated from this; the case never trusts it blindly. */
export interface BirthCertificateData {
  childLastName: string;
  childFirstName: string;
  sex: string;
  birthDate: string;
  birthPlace: string;
  childPesel: string;
  fatherFirstName: string;
  fatherLastName: string;
  motherFirstName: string;
  motherLastName: string;
  motherMaidenName: string;
}

export function kamilCertificate(birthDate = "2026-05-20"): BirthCertificateData {
  return {
    childLastName: "WRONA",
    childFirstName: "ANTONI",
    sex: "MĘŻCZYZNA",
    birthDate,
    birthPlace: "KRAKÓW",
    childPesel: makePesel(birthDate, 456, true),
    fatherFirstName: "KAMIL",
    fatherLastName: "WRONA",
    motherFirstName: "ZOFIA",
    motherLastName: "WRONA",
    motherMaidenName: "KOS",
  };
}
