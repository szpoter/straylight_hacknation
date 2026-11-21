/** Polish identifiers: checksums and the birth date encoded in PESEL. Used to catch misread digits. */

const PESEL_WEIGHTS = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];

export function peselChecksum(first10: string): number {
  const sum = [...first10].reduce((acc, d, i) => acc + Number(d) * PESEL_WEIGHTS[i], 0);
  return (10 - (sum % 10)) % 10;
}

export function isValidPesel(pesel: string): boolean {
  if (!/^\d{11}$/.test(pesel)) return false;
  return peselChecksum(pesel.slice(0, 10)) === Number(pesel[10]) && peselBirthDate(pesel) !== null;
}

/** Birth date (ISO) from PESEL; months +20 for 2000–2099, +80 for 1800s, +40/+60 for 2100s/2200s. */
export function peselBirthDate(pesel: string): string | null {
  if (!/^\d{6}/.test(pesel)) return null;
  const yy = Number(pesel.slice(0, 2));
  const mmRaw = Number(pesel.slice(2, 4));
  const dd = Number(pesel.slice(4, 6));
  const centuries: [number, number][] = [
    [80, 1800],
    [60, 2200],
    [40, 2100],
    [20, 2000],
    [0, 1900],
  ];
  const found = centuries.find(([offset]) => mmRaw > offset && mmRaw <= offset + 12);
  if (!found) return null;
  const [offset, century] = found;
  const iso = `${century + yy}-${String(mmRaw - offset).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  const date = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(iso) ? iso : null;
}

/** Builds a valid PESEL for fictional people (demo documents and tests). */
export function makePesel(birthIso: string, serial: number, male: boolean): string {
  const [y, m, d] = birthIso.split("-").map(Number);
  const offset = y >= 2000 ? 20 : 0;
  const s = serial % 1000;
  const genderDigit = (male ? 1 : 0) + (s % 4) * 2;
  const base = [y % 100, m + offset, d].map((n) => String(n).padStart(2, "0")).join("") + String(s).padStart(3, "0") + genderDigit;
  return `${base}${peselChecksum(base)}`;
}

export function isValidNip(nip: string): boolean {
  const digits = nip.replace(/\D/g, "");
  if (digits.length !== 10) return false;
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const sum = weights.reduce((acc, w, i) => acc + w * Number(digits[i]), 0);
  return sum % 11 === Number(digits[9]);
}

export function isValidRegon(regon: string): boolean {
  const digits = regon.replace(/\D/g, "");
  if (digits.length !== 9) return false;
  const weights = [8, 9, 2, 3, 4, 5, 6, 7];
  const control = weights.reduce((acc, w, i) => acc + w * Number(digits[i]), 0) % 11;
  return (control === 10 ? 0 : control) === Number(digits[8]);
}

function mod97(digits: string): number {
  let remainder = 0;
  for (const ch of digits) remainder = (remainder * 10 + Number(ch)) % 97;
  return remainder;
}

/** Builds a valid NRB from 24 digits (bank + account) for fictional data. */
export function makeNrb(rest24: string): string {
  const check = 98 - mod97(`${rest24}252100`);
  return `${String(check).padStart(2, "0")}${rest24}`;
}

/** Builds a valid NIP from 9 digits; returns null when that base has no valid check digit. */
export function makeNip(first9: string): string | null {
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const control = weights.reduce((acc, w, i) => acc + w * Number(first9[i]), 0) % 11;
  return control === 10 ? null : `${first9}${control}`;
}

export function makeRegon(first8: string): string {
  const weights = [8, 9, 2, 3, 4, 5, 6, 7];
  const control = weights.reduce((acc, w, i) => acc + w * Number(first8[i]), 0) % 11;
  return `${first8}${control === 10 ? 0 : control}`;
}

/** Polish NRB (26 digits) with the IBAN mod-97 check. */
export function isValidNrb(account: string): boolean {
  const digits = account.replace(/\s/g, "");
  if (!/^\d{26}$/.test(digits)) return false;
  const rearranged = `${digits.slice(2)}2521${digits.slice(0, 2)}`; // "PL" = 25 21
  let remainder = 0;
  for (const ch of rearranged) remainder = (remainder * 10 + Number(ch)) % 97;
  return remainder === 1;
}
