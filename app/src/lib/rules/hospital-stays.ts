import { addDays, daysBetween, isValidIso } from "./dates";

export interface HospitalCertificate {
  birth: string;
  gestationDays: number;
  children: { birthWeightGrams: number; stays: { from: string; to: string }[] }[];
  /** For adoption/fostering, only hospitalization after taking the child into care counts. */
  acceptedOn?: string;
}

/** KP art. 180² §1–3, 183 §3¹, effective 19 March 2025. One child per certificate entry. */
export function hospitalLeaveWeeks(e: HospitalCertificate) {
  if (!isValidIso(e.birth) || (e.acceptedOn !== undefined && (!isValidIso(e.acceptedOn) || e.acceptedOn < e.birth)) ||
      !Number.isSafeInteger(e.gestationDays) || e.gestationDays <= 0 || !e.children.length ||
      e.children.some(child => !Number.isSafeInteger(child.birthWeightGrams) || child.birthWeightGrams <= 0)) {
    throw new RangeError("invalid_hospital_certificate");
  }
  const extreme = e.gestationDays < 28 * 7 || e.children.some(child => child.birthWeightGrams <= 1000);
  const term = !extreme && e.gestationDays >= 37 * 7;
  const windowFrom = [addDays(e.birth, term ? 5 : 1), e.acceptedOn ? addDays(e.acceptedOn, 1) : e.birth].sort()[1];
  const windowTo = addDays(e.birth, 7 * (extreme ? 15 : 8));
  const lastQualifyingStart = addDays(e.birth, 28);
  let longest = 0;
  for (const child of e.children) {
    const covered = new Set<string>();
    for (const stay of child.stays) {
      if (!isValidIso(stay.from) || !isValidIso(stay.to) || stay.to < stay.from) throw new RangeError("invalid_hospital_stay");
      const from = stay.from < windowFrom ? windowFrom : stay.from;
      const to = stay.to > windowTo ? windowTo : stay.to;
      const days = daysBetween(from, to) + 1;
      for (let i = 0; i < days; i++) covered.add(addDays(from, i));
    }
    if (!term || [...covered].some(day => day <= lastQualifyingStart && covered.has(addDays(day, 1)))) longest = Math.max(longest, covered.size);
  }
  return { from: windowFrom, to: windowTo, days: longest, weeks: Math.ceil(longest / 7) };
}
