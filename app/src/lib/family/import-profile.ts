import { OLA } from "./ola";

const mobileRecords = {
  mObywatel: {
    mother: OLA.mother,
    father: OLA.father,
    child: OLA.child,
    birthDate: OLA.birthDate,
  },
  mZUS: {
    employer: OLA.employer,
    insuranceTitle: "Umowa o pracę",
  },
};

export function importFamilyProfile() {
  return { ...mobileRecords.mObywatel, ...mobileRecords.mZUS };
}

export type FamilyProfile = ReturnType<typeof importFamilyProfile>;
